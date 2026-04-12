import { LlmAgent, GoogleSearchTool } from '@google/adk';

export function getResearcherAgent() {
  return new LlmAgent({
    name: 'researcher',
    model: 'gemini-2.5-pro',
    tools: [new GoogleSearchTool()],
    instruction: `
        You are an expert Niche Analyst. Use the Google Search tool to find 
        trending, highly engaging angles and recent data points based on 
        the user's \`target_topics\` and \`target_niche\`. 
        Return a structured Research Brief containing verifiable facts.
        `,
  });
}
