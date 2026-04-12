import { NextResponse } from 'next/server';
import { getOrchestrator } from '@/agents/orchestrator';
import { InMemoryRunner, stringifyContent } from '@google/adk';
import { verifyFirebaseRequest } from '@/lib/server-auth';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const decodedToken = await verifyFirebaseRequest(req);

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userSnap = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const userData = userSnap.data();

    if (!userData?.target_niche || !userData?.target_topics || !userData?.integrations?.linkedin?.access_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const inputData = `
        User ID: ${decodedToken.uid}
        Niche: ${userData.target_niche}
        Topics: ${userData.target_topics}
        LinkedIn Token: ${userData.integrations.linkedin.access_token}
        User URN: ${userData.integrations?.linkedin?.user_urn || 'unknown'}
        `;


    const orchestrator = getOrchestrator();
    const runner = new InMemoryRunner({ agent: orchestrator });

    const resultStream = runner.runEphemeral({
      userId: decodedToken.uid,
      newMessage: { role: 'user', parts: [{ text: inputData }] },
    });

    let fullText = '';
    for await (const event of resultStream) {
      fullText += stringifyContent(event);
    }

    return NextResponse.json({ success: true, result: fullText });
  } catch (error: any) {
    console.error('Workflow Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
