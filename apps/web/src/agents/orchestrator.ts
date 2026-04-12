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
    model: 'gemini-2.5-pro',
    tools: [
      new AgentTool({ agent: researcher }),
      new AgentTool({ agent: imageGen }),
      new AgentTool({ agent: writer }),
      new AgentTool({ agent: publisher }),
    ],
    instruction: `
        Coordinate the LinkedIn article generation and publishing process.
        1. Call 'researcher' with the user's niche and topics.
        2. Call 'image_gen' with the research brief from 'researcher' to generate 
           the image brief / visual references for the article.
        3. Pass the image brief from 'image_gen' to 'publisher' so that the 
              article can be drafted with the visual references / image 
              inspiration included.
        4. Pass the research brief from 'researcher' to 'writer' so that the 
              article can be written based on the research that was gathered.
        5. Pass the final article, access_token, and user_urn to 'publisher'.
        
        Ensure you maintain the user's preferences throughout the chain.
        `,
  });
}
