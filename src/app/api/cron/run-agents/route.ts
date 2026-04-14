/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { getOrchestrator } from '@/agents/orchestrator';
import { InMemoryRunner, stringifyContent } from '@google/adk';

export async function GET(req: Request) {
  // Simple check for authorization (e.g., Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersRef = dbAdmin.collection("users");
    const querySnapshot = await usersRef.where("isSubscribed", "==", true).get();

    const activeUsers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    }));

    const orchestrator = getOrchestrator();
    const runner = new InMemoryRunner({ agent: orchestrator });

    const results = await Promise.all(activeUsers.map(async (user: any) => {
        try {
            const inputData = `
                User ID: ${user.id}
                Niche: ${user.target_niche}
                Topics: ${user.target_topics}
                LinkedIn Token: ${user.integrations?.linkedin?.access_token}
                User URN: ${user.integrations?.linkedin?.user_urn || 'unknown'}
                `;
            
            const resultStream = runner.runEphemeral({
              userId: user.id,
              newMessage: { role: 'user', parts: [{ text: inputData }] },
            });

            let fullText = '';
            for await (const event of resultStream) {
              fullText += stringifyContent(event);
            }

            return { userId: user.id, status: 'success' };
        } catch (error) {
            console.error(`Error running agent for user ${user.id}:`, error);
            return { userId: user.id, status: 'error' };
        }
    }));

    return NextResponse.json({ processed: results.length, details: results });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
