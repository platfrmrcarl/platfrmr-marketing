/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmAgent, FunctionTool } from '@google/adk';
import { z } from 'zod';

export const getLinkedinUrnTool = new FunctionTool({
  name: 'get_linkedin_urn',
  description: 'Fetches the authenticated user\'s LinkedIn URN (member ID).',
  parameters: z.object({
    access_token: z.string().describe("The user's LinkedIn access token."),
  }),
  execute: async ({ access_token }: any) => {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn Profile API error: ${response.status} - ${text}`);
    }
    const data = await response.json();
    return { user_urn: data.id };
  },
});

export const publishToLinkedinTool = new FunctionTool({
  name: 'publish_to_linkedin',
  description: 'Publishes an article to LinkedIn using the UGC Post API.',
  parameters: z.object({
    article_text: z.string().describe('The final text of the LinkedIn article.'),
    access_token: z.string().describe("The user's LinkedIn access token."),
    user_urn: z.string().describe("The user's LinkedIn URN (e.g. '12345')."),
  }),
  execute: async ({ article_text, access_token, user_urn }: any) => {
    const url = 'https://api.linkedin.com/rest/posts';
    const author = user_urn.startsWith('urn:li:')
      ? user_urn
      : `urn:li:person:${user_urn}`;

    const payload = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: article_text,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} - ${text}`);
    }

    return { status: 'success', response: await response.json() };
  },
});

export function getPublisherAgent() {
  return new LlmAgent({
    name: 'publisher',
    model: 'gemini-1.5-pro',
    tools: [getLinkedinUrnTool, publishToLinkedinTool],
    instruction: `
        Take the finalized article text and construct the correct JSON payload 
        for the LinkedIn UGC Post API. 
        
        If the 'user_urn' is missing or set to 'unknown', call 'get_linkedin_urn' 
        first using the provided 'access_token' to retrieve the correct URN.
        
        Then, use the LinkedIn 'access_token' and the (retrieved) 'user_urn' 
        to execute the 'publish_to_linkedin' call.
        `,
  });
}
