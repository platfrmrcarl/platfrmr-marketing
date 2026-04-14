/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmAgent, AgentTool } from '@google/adk';
import { getResearcherAgent } from './researcher';
import { getImageGenAgent } from './imageGen';
import { getWriterAgent } from './writer';
import { getPublisherAgent } from './publisher';

export function getOrchestrator() {
  const researcher = getResearcherAgent();
  const imageGen = getImageGenAgent();
  const writer = getWriterAgent();
  const publisher = getPublisherAgent();
  
  return new LlmAgent({
    name: 'orchestrator',
    model: process.env.MODEL_ID || 'gemini-2.5-flash',
    tools: [
      new AgentTool({ agent: researcher }),
      new AgentTool({ agent: imageGen }),
      new AgentTool({ agent: writer }),
      new AgentTool({ agent: publisher }),
    ],
    instruction: `You are the lead orchestrator for a LinkedIn content generation pipeline. Your mission is to research, design, write, and publish an expert-level article for a user.

Follow this exact sequence:
1. Call the 'researcher' tool with the User ID from the initial message. The researcher will fetch target_niche and target_topics from Firestore users table.
2. Call the 'image_gen' tool with the same niche and topics to gather visual inspiration and generate an image URL. Capture image_gen.image_url.
3. Call the 'writer' tool, providing BOTH the Research Brief and the Image Brief, to draft a high-impact, scannable LinkedIn post.
4. Finally, call the 'publisher' tool. Use the 'access_token' and 'User URN' provided in the initial user message, and pass image_gen.image_url as image_url.

CRITICAL: The 'access_token' is provided in the input data. You MUST pass it exactly as is to the publisher tool.

CRITICAL: If image_gen returns image_url, you MUST pass that exact URL to publisher.image_url.

CRITICAL: Verify the response from 'publisher'. If it fails, report the error. Do not claim success unless the publisher tool confirms the post is live.

FINAL RESPONSE REQUIREMENT:
- You MUST return a final JSON object.
- On success, return: {"status":"published","postId":"...","imageUrl":"...","message":"..."}
- On failure, return: {"status":"failed","error":"..."}
- Never return an empty response.`,
  });
}
