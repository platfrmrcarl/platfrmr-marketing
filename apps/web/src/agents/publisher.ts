/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmAgent, FunctionTool } from '@google/adk';
import { z } from 'zod';

function normalizeLinkedinVersion(version: string) {
  const digits = version.replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(0, 6) : '';
}

function getLinkedinVersionCandidates() {
  const envVersion = process.env.LINKEDIN_API_VERSION
    ? normalizeLinkedinVersion(process.env.LINKEDIN_API_VERSION)
    : '';

  if (envVersion) {
    return [envVersion];
  }

  // Try current month and previous 11 months in YYYYMM format.
  const now = new Date();
  const candidates: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    candidates.push(`${y}${m}`);
  }

  return candidates;
}

function buildLinkedinHeaders(accessToken: string, version: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': version,
  };

  return headers;
}

function isNonexistentVersionError(status: number, body: string) {
  return status === 426 && body.includes('NONEXISTENT_VERSION');
}

function isVersionMissingError(status: number, body: string) {
  return status === 400 && body.includes('VERSION_MISSING');
}

async function postLinkedinJsonWithVersionFallback(
  url: string,
  accessToken: string,
  body: string,
  signal?: AbortSignal,
) {
  const versions = getLinkedinVersionCandidates();
  let lastStatus = 0;
  let lastBody = '';

  for (const version of versions) {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildLinkedinHeaders(accessToken, version),
      body,
      signal,
    });

    const text = await response.text();

    if (response.ok) {
      let data: any = null;
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }

      return { ok: true as const, status: response.status, text, data, version };
    }

    if (isNonexistentVersionError(response.status, text) || isVersionMissingError(response.status, text)) {
      lastStatus = response.status;
      lastBody = text;
      console.warn(`Publisher: LinkedIn version ${version} not accepted (${response.status}). Trying another version...`);
      continue;
    }

    return { ok: false as const, status: response.status, text, version };
  }

  return {
    ok: false as const,
    status: lastStatus || 400,
    text: lastBody || 'No active LinkedIn API version found in fallback candidates.',
    version: 'none',
  };
}

function buildPublishPayload(articleText: string, author: string, imageUrn?: string) {
  const payload: any = {
    author,
    commentary: articleText,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
    },
    lifecycleState: 'PUBLISHED',
  };

  // If an image URN is provided, attach it to the post's content
  if (imageUrn) {
    payload.content = {
      media: {
        id: imageUrn,
      },
    };
  }

  return payload;
}

function isDuplicatePostError(status: number, body: string) {
  return (
    status === 422 &&
    (body.includes('DUPLICATE_POST') || body.toLowerCase().includes('duplicate post'))
  );
}

function isOldTemplatePost(text: string) {
  const normalized = text.toLowerCase();
  return (
    normalized.includes('what i\'m learning right now') &&
    normalized.includes('key focus areas:') &&
    normalized.startsWith('building in ')
  );
}

function rewriteLowSignalPost(text: string) {
  const nicheMatch = text.match(/building in\s+(.+?):\s+what i'm learning right now\./i);
  const topicsMatch = text.match(/key focus areas:\s*([\s\S]*)/i);

  const niche = nicheMatch?.[1]?.trim() || 'AI product building';
  const topicsRaw = topicsMatch?.[1]?.trim() || 'shipping agent-powered workflows';
  const firstTopic = topicsRaw.split(',')[0]?.trim() || topicsRaw;

  return [
    `Most teams overcomplicate ${niche} before they validate one repeatable win.`,
    '',
    `A practical lesson from building around ${firstTopic}: speed comes from tighter feedback loops, not bigger plans.`,
    '',
    'A simple framework I keep using:',
    '1) Define one measurable outcome for this week.',
    '2) Keep one manual checkpoint before automation.',
    '3) Turn repeated manual steps into tools only after they are stable.',
    '',
    'If you had to simplify one step in your current workflow today, which step would it be?',
    '',
    '#AI #AgenticSystems #SaaS #BuildInPublic'
  ].join('\n');
}

// --- NEW: Helper function to handle the 3-step image upload process ---
async function uploadImageToLinkedin(imageUrl: string, authorUrn: string, accessToken: string): Promise<string> {
  console.log('Publisher: Fetching image from URL:', imageUrl);
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch image from URL: ${imgRes.status} ${imgRes.statusText}`);
  }
  const arrayBuffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

  console.log('Publisher: Initializing image upload with LinkedIn...');
  const initResult = await postLinkedinJsonWithVersionFallback(
    'https://api.linkedin.com/rest/images?action=initializeUpload',
    accessToken,
    JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
      },
    }),
  );

  if (!initResult.ok) {
    throw new Error(`LinkedIn Image init error: ${initResult.status} - ${initResult.text}`);
  }

  const initData = initResult.data;
  const uploadUrl = initData.value.uploadUrl;
  const imageUrn = initData.value.image;

  console.log('Publisher: Uploading image binary data to LinkedIn...');
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    body: arrayBuffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`LinkedIn Image upload error: ${uploadRes.status} - ${text}`);
  }

  console.log('Publisher: Image successfully uploaded. URN:', imageUrn);
  return imageUrn;
}
// ---------------------------------------------------------------------

export const getLinkedinUrnTool = new FunctionTool({
  name: 'get_linkedin_urn',
  description: 'Fetches the authenticated user\'s LinkedIn URN (member ID) using the OIDC userinfo endpoint.',
  parameters: z.object({
    access_token: z.string().describe("The user's LinkedIn access token."),
  }),
  execute: async ({ access_token }: any) => {
    console.log('Publisher: get_linkedin_urn called');
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn userinfo API error: ${response.status} - ${text}`);
    }
    const data = await response.json();
    return { user_urn: data.sub };
  },
});

export const publishToLinkedinTool = new FunctionTool({
  name: 'publish_to_linkedin',
  description: 'Publishes a post to LinkedIn using the Posts API (rest/posts), with optional image upload.',
  parameters: z.object({
    article_text: z.string().describe('The final text of the LinkedIn article.'),
    access_token: z.string().describe("The user's LinkedIn access token."),
    user_urn: z.string().describe("The user's LinkedIn URN (e.g. '12345' or 'urn:li:person:12345')."),
    image_url: z.string().optional().describe('An optional URL to an image to upload and attach to the post.'),
  }),
  execute: async ({ article_text, access_token, user_urn, image_url }: any) => {
    console.log('Publisher: publish_to_linkedin called for user:', user_urn);
    const url = 'https://api.linkedin.com/rest/posts';
    const author = user_urn.startsWith('urn:li:')
      ? user_urn
      : `urn:li:person:${user_urn}`;

    let articleText = String(article_text || '').trim();
    if (isOldTemplatePost(articleText)) {
      console.warn('Publisher: Detected old low-signal template post. Rewriting before publish.');
      articleText = rewriteLowSignalPost(articleText);
    }

    // Handle optional image upload
    let imageUrn: string | undefined = undefined;
    if (image_url) {
      try {
        imageUrn = await uploadImageToLinkedin(image_url, author, access_token);
      } catch (imgError) {
        console.error('Publisher: Failed to upload image. Proceeding without it.', imgError);
        // Optional: you could throw here if the image is strictly required
      }
    }

    const payload = buildPublishPayload(articleText, author, imageUrn);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      console.log('Publisher: POSTing to LinkedIn REST posts endpoint with payload (truncated to 200 chars):', JSON.stringify(payload).substring(0, 200) + (JSON.stringify(payload).length > 200 ? '...' : ''));
      const response = await postLinkedinJsonWithVersionFallback(
        url,
        access_token,
        JSON.stringify(payload),
        controller.signal,
      );

      if (!response.ok) {
        const text = response.text;

        if (isDuplicatePostError(response.status, text)) {
          console.log('Publisher: Duplicate post detected. Retrying with a timestamp suffix...');
          const uniqueSuffix = `\n\n(Updated: ${new Date().toISOString()})`;
          const retryPayload = buildPublishPayload(`${articleText}${uniqueSuffix}`, author, imageUrn);

          const retryResponse = await postLinkedinJsonWithVersionFallback(
            url,
            access_token,
            JSON.stringify(retryPayload),
            controller.signal,
          );

          if (retryResponse.ok) {
            return {
              status: 'success',
              deduplicated: true,
              response: retryResponse.data,
              linkedinVersion: retryResponse.version,
            };
          }

          const retryText = retryResponse.text;
          console.error(`LinkedIn API Retry Error (${retryResponse.status}):`, retryText);
          throw new Error(`LinkedIn API retry error: ${retryResponse.status} - ${retryText}`);
        }

        console.error(`LinkedIn API Error (${response.status}):`, text);
        throw new Error(`LinkedIn API error: ${response.status} - ${text}`);
      }

      return { status: 'success', response: response.data, linkedinVersion: response.version };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('LinkedIn API call timed out after 60 seconds.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

export function getPublisherAgent() {
  return new LlmAgent({
    name: 'publisher',
    model: process.env.MODEL_ID || 'gemini-2.5-flash',
    tools: [getLinkedinUrnTool, publishToLinkedinTool],
    instruction: `
        Take the finalized article text and construct the correct parameters 
        for the 'publish_to_linkedin' tool. 
        
        You MUST use the 'access_token' and 'user_urn' provided to you.
        If an image should be attached, provide the public URL to it in the 'image_url' parameter.
        
        If the 'user_urn' is missing, set to 'unknown', or is not a valid URN format (e.g., '12345'), 
        you MUST call 'get_linkedin_urn' first using the provided 'access_token' 
        to retrieve the correct sub/member ID.
        
        Then, execute the 'publish_to_linkedin' call with the finalized article, 
        the access_token, the correct URN, and the image_url if applicable.
        `,
  });
}