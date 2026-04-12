import { LlmAgent } from '@google/adk';

export function getWriterAgent() {
  return new LlmAgent({
    name: 'writer',
    model: 'gemini-2.5-pro',
    instruction: `
        You are an elite LinkedIn Ghostwriter. Draft a highly scannable, 
        expert-level LinkedIn article using the provided Research Brief. 
        Tailor the tone to the \`target_audience\`. Apply \`preferred_hashtags\` 
        at the bottom. Do not use corporate fluff.
        `,
  });
}
