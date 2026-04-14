/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmAgent, GoogleSearchTool, FunctionTool } from '@google/adk';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';

const STOP_WORDS = new Set([
  'and',
  'or',
  'the',
  'a',
  'an',
  'to',
  'for',
  'of',
  'in',
  'on',
  'with',
  'build',
  'building',
]);

function extractFocusCandidates(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9+.#-]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function pickFocusWord(userId: string, targetNiche: string, targetTopics: string) {
  const candidates = [
    ...extractFocusCandidates(targetNiche),
    ...extractFocusCandidates(targetTopics),
  ];

  if (!candidates.length) {
    return 'saas';
  }

  // Deterministic pick per user and strategy to keep outputs focused and stable.
  const seedInput = `${userId}:${targetNiche}:${targetTopics}`;
  let hash = 0;
  for (const ch of seedInput) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }

  return candidates[hash % candidates.length];
}

export const getUserStrategyTool = new FunctionTool({
  name: 'get_user_strategy',
  description: 'Loads target_niche and target_topics from Firestore users/{userId}.',
  parameters: z.object({
    user_id: z.string().describe('Authenticated user ID used as users collection document ID.'),
  }),
  execute: async ({ user_id }: any) => {
    const id = String(user_id);
    const snap = await dbAdmin.collection('users').doc(id).get();
    const userData = snap.data() as { target_niche?: string; target_topics?: string } | undefined;

    if (!userData?.target_niche || !userData?.target_topics) {
      throw new Error('Missing target_niche or target_topics in Firestore users record.');
    }

    const focusWord = pickFocusWord(id, userData.target_niche, userData.target_topics);

    return {
      user_id: id,
      target_niche: userData.target_niche,
      target_topics: userData.target_topics,
      focus_word: focusWord,
    };
  },
});

export function getResearcherAgent() {
  return new LlmAgent({
    name: 'researcher',
    model: process.env.MODEL_ID || 'gemini-2.5-flash',
    tools: [getUserStrategyTool, new GoogleSearchTool()],
    instruction: `
        You are an expert Niche Analyst.

        REQUIRED STEPS:
        1) First call the 'get_user_strategy' tool using the provided user_id.
        2) From the tool response, use the returned focus_word as your single research focus keyword.
        3) Use target_niche and target_topics only as context, but center all search queries around focus_word.
        4) Use Google Search to find trending, highly engaging angles and recent data points for that focus_word.

        Return a structured Research Brief containing verifiable facts and explicitly include the selected focus_word.
        `,
  });
}
