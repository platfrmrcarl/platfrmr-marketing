/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmAgent, GoogleSearchTool, FunctionTool } from '@google/adk';
import { z } from 'zod';

export const generatePostImageTool = new FunctionTool({
  name: 'generate_post_image',
  description: 'Generates a social image URL for the LinkedIn post and returns a public image_url.',
  parameters: z.object({
    image_prompt: z.string().describe('Detailed prompt for generating the post image.'),
    width: z.number().optional().describe('Image width in pixels. Defaults to 1200.'),
    height: z.number().optional().describe('Image height in pixels. Defaults to 627.'),
  }),
  execute: async ({ image_prompt, width = 1200, height = 627 }: any) => {
    const prompt = String(image_prompt || '').trim() || 'Modern professional LinkedIn cover visual.';
    const seed = Date.now();
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const probe = await fetch(imageUrl);
    if (!probe.ok) {
      throw new Error(`Image generation failed: ${probe.status} ${probe.statusText}`);
    }

    return {
      image_url: imageUrl,
      image_prompt: prompt,
      width,
      height,
      provider: 'pollinations',
    };
  },
});

export function getImageGenAgent() {
  return new LlmAgent({
    name: 'image_gen',
    model: process.env.MODEL_ID || 'gemini-2.5-flash',
    tools: [new GoogleSearchTool(), generatePostImageTool],
    instruction: `
        You are an expert Image Generation Specialist for LinkedIn.

        Steps:
        1) Use Google Search to gather current visual trends and references based on the user's target_topics and target_niche.
        2) Build a production-ready image prompt for a professional, high-contrast social visual.
        3) Call the 'generate_post_image' tool with that prompt.

        You MUST return a final JSON object with:
        - image_url
        - image_prompt
        - visual_direction
        - source_references

        The image_url must be a direct, publicly reachable URL that can be used by the publisher tool.
        `,
  });
}
