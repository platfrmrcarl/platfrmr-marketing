import { LlmAgent, GoogleSearchTool } from '@google/adk';

export function getImageGenAgent() {
  return new LlmAgent({
    name: 'image_gen',
    model: 'gemini-3-flash',
    tools: [new GoogleSearchTool()],
    instruction: `
        You are an expert Image Generation Specialist. Use the Google Search tool 
        to find trending, highly engaging visual content and image references 
        based on the user's \`target_topics\` and \`target_niche\`. 
        Return a structured Image Brief containing verifiable image sources 
        and inspiration for the image generation task.
        `,
    generateContentConfig: {
      temperature: 0.7,
    },
  });
}
