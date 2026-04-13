import { NextResponse } from 'next/server';

function configureAdkBackend() {
  const useVertex = process.env.ADK_USE_VERTEX_AI === 'true';
  const hasVertexConfig = Boolean(
    process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION
  );

  if (useVertex) {
    if (!hasVertexConfig) {
      throw new Error('ADK_USE_VERTEX_AI=true but GOOGLE_CLOUD_PROJECT/GOOGLE_CLOUD_LOCATION are missing.');
    }

    process.env.ADK_BACKEND = 'VERTEX_AI';
    process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
    process.env.MODEL_ID = process.env.MODEL_ID || 'gemini-2.5-flash';
    return 'VERTEX_AI';
  }

  process.env.ADK_BACKEND = 'GEMINI_API';
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'false';

  if (!process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
  }

  // Prevent Google SDK from preferring GOOGLE_API_KEY when both are present.
  delete process.env.GOOGLE_API_KEY;
  // Prevent Vertex auto-selection and ADC usage when Gemini API mode is desired.
  delete process.env.GOOGLE_CLOUD_PROJECT;
  delete process.env.GOOGLE_CLOUD_LOCATION;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY for Gemini API backend.');
  }

  process.env.MODEL_ID = process.env.MODEL_ID || 'gemini-2.5-flash';
  return 'GEMINI_API';
}

const adkBackend = configureAdkBackend();

import { getOrchestrator } from '@/agents/orchestrator';
import { getWriterAgent } from '@/agents/writer';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { verifyFirebaseRequest } from '@/lib/server-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import { getLinkedinUrnTool, publishToLinkedinTool } from '@/agents/publisher';

interface UserData {
  target_niche?: string;
  target_topics?: string;
  linkedin_id?: string;
  integrations?: {
    linkedin?: {
      access_token?: string;
    };
  };
}

async function generateFallbackArticleWithWriter(userId: string, userData: UserData) {
  const writer = getWriterAgent();
  const writerRunner = new InMemoryRunner({ agent: writer });

  const writerPrompt = [
    'Write a creative, opinionated LinkedIn post for a technical founder.',
    `Niche: ${userData.target_niche || 'SaaS and AI'}`,
    `Topics: ${userData.target_topics || 'AI agents, product building, growth'}`,
    '',
    'Requirements:',
    '- Start with a strong hook (1 sentence).',
    '- Share one concrete lesson and one mistake to avoid.',
    '- Include one mini-framework with 3 bullets.',
    '- End with a discussion CTA.',
    '- 180-320 words total.',
    '- Do not simply list niche/topics verbatim.',
    '- Add 3-5 relevant hashtags at the end.',
  ].join('\n');

  const writerStream = writerRunner.runEphemeral({
    userId,
    newMessage: { role: 'user', parts: [{ text: writerPrompt }] },
  });

  let article = '';
  for await (const event of writerStream) {
    const content = stringifyContent(event);
    if (content) {
      article += content;
    }
  }

  return article.trim();
}

export async function POST(req: Request) {
  try {
    const decodedToken = await verifyFirebaseRequest(req);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSnap = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const userData = userSnap.data() as UserData | undefined;

    if (!userData?.target_niche || !userData?.target_topics || !userData?.integrations?.linkedin?.access_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const accessToken = userData?.integrations?.linkedin?.access_token;
    console.log('Workflow: Using access token starting with:', accessToken?.substring(0, 10) + '...');

    const inputData = `
        User ID: ${decodedToken.uid}
        Niche: ${userData.target_niche}
        Topics: ${userData.target_topics}
        access_token: ${accessToken}
        User URN: ${userData.linkedin_id || 'unknown'}
        `;

    const orchestrator = getOrchestrator();

    const runner = new InMemoryRunner({ 
      agent: orchestrator
    });

    console.log(`Workflow: Starting runner (${adkBackend} backend)`);

    const resultStream = runner.runEphemeral({
      userId: decodedToken.uid,
      newMessage: { role: 'user', parts: [{ text: inputData }] },
    });

    let fullText = '';
    const streamErrors: string[] = [];
    let totalEvents = 0;
    const toolCalls: string[] = [];
    const toolResponses: Array<{ name: string; response: unknown }> = [];
    let publisherResponse: unknown = null;

    const recordEventTools = (event: any) => {
      const parts = event?.content?.parts;
      if (!Array.isArray(parts)) {
        return;
      }

      for (const part of parts) {
        const functionCall = part?.functionCall;
        if (functionCall?.name) {
          const name = String(functionCall.name);
          toolCalls.push(name);
          console.log('Tool Call:', name);
        }

        const functionResponse = part?.functionResponse;
        if (functionResponse?.name) {
          const name = String(functionResponse.name);
          const response = functionResponse.response;
          toolResponses.push({ name, response });
          console.log('Tool Response:', name, '=', JSON.stringify(response).substring(0, 200));
          if (name === 'publish_to_linkedin') {
            publisherResponse = response;
            console.log('Captured publisher response:', response);
          }
        }
      }
    };

    try {
      for await (const event of resultStream) {
        totalEvents += 1;
        const ev = event as any;
        recordEventTools(ev);
        
        if (ev.type === 'error' || ev.errorMessage) {
          const errorMessage = String(ev.errorMessage || 'Unknown ADK error');
          console.error('ADK generation error:', errorMessage);
          streamErrors.push(errorMessage);
        }

        const content = stringifyContent(event);
        if (content) {
          console.log('Event #' + totalEvents + ' stringifyContent returned:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
          fullText += content;
        }
      }
    } catch (streamError: any) {
      console.error('Stream Error:', streamError);
      const errorMessage = String(streamError?.message || streamError);
      streamErrors.push(errorMessage);
      fullText += `\n[Error during generation: ${errorMessage}]`;
    }

    console.log('Workflow Finished. Result length:', fullText.length);
    console.log('Publisher Response:', publisherResponse);
    console.log('Tool Calls:', toolCalls);
    console.log('Tool Responses:', toolResponses);

    if (!fullText.trim()) {
      console.log('No output text from orchestrator. Checking if publisher was invoked...');
      
      if (publisherResponse) {
        console.log('Publisher response detected, returning success:', publisherResponse);
        return NextResponse.json({
          success: true,
          result: JSON.stringify({ status: 'published', publisherResponse }),
        });
      }

      console.log('No publisher response. Attempting fallback publish...');
      // Fallback path: if ADK does not emit final text, generate post text with writer, then publish.
      try {
        let urn = userData.linkedin_id || 'unknown';
        if (!urn || urn === 'unknown') {
          const urnResult = await (getLinkedinUrnTool as any).execute({ access_token: accessToken });
          urn = urnResult?.user_urn || 'unknown';
        }

        let fallbackArticle = await generateFallbackArticleWithWriter(decodedToken.uid, userData);

        // Final safety fallback if writer generation is empty.
        if (!fallbackArticle.trim()) {
          fallbackArticle = [
            `I stopped treating ${userData.target_niche} like a features race and started treating it like a systems problem.`,
            '',
            `Working on ${userData.target_topics}, the biggest unlock was reducing complexity before adding automation.`,
            '',
            'My 3-step rule:',
            '1) Clarify one measurable outcome.',
            '2) Cut any step that does not move that metric.',
            '3) Automate only after the manual flow works repeatedly.',
            '',
            'What would you simplify first in your current workflow?',
            '',
            '#AI #Agents #SaaS #BuildInPublic'
          ].join('\n');
        }

        const publishResult = await (publishToLinkedinTool as any).execute({
          article_text: fallbackArticle,
          access_token: accessToken,
          user_urn: urn,
        });

        console.log('Fallback publish succeeded:', publishResult);
        return NextResponse.json({
          success: true,
          result: JSON.stringify({
            status: 'published',
            fallbackUsed: true,
            publisherResponse: publishResult,
          }),
        });
      } catch (fallbackError: any) {
        const errorMsg = String(fallbackError?.message || fallbackError);
        console.error('Fallback publish failed:', errorMsg);
        streamErrors.push(errorMsg);

        const firstError = streamErrors[0] || 'No output was generated by ADK workflow.';
        return NextResponse.json(
          {
            success: false,
            error: firstError,
            details: streamErrors,
            diagnostics: {
              backend: adkBackend,
              totalEvents,
              toolCalls,
              toolResponses,
              publisherInvoked: toolCalls.includes('publish_to_linkedin'),
              publisherResponded: Boolean(publisherResponse),
            },
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: true, result: fullText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Workflow Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
