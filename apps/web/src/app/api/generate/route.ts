import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/agents/orchestrator';
import { InMemoryRunner, stringifyContent } from '@google/adk';

export async function POST(req: Request) {
  try {
    const { userId, target_niche, target_topics, linkedin_token, user_urn } = await req.json();

    if (!userId || !target_niche || !target_topics || !linkedin_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const inputData = `
        User ID: ${userId}
        Niche: ${target_niche}
        Topics: ${target_topics}
        LinkedIn Token: ${linkedin_token}
        User URN: ${user_urn || 'unknown'}
        `;


    const orchestrator = getOrchestrator();
    const runner = new InMemoryRunner({ agent: orchestrator });

    const resultStream = runner.runEphemeral({
      userId: userId,
      newMessage: { role: 'user', parts: [{ text: inputData }] },
    });

    let fullText = '';
    for await (const event of resultStream) {
      fullText += stringifyContent(event);
    }

    return NextResponse.json({ success: true, result: fullText });
  } catch (error: any) {
    console.error('Workflow Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
