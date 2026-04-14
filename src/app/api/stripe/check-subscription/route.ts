import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbAdmin } from '@/lib/firebase-admin';
import { verifyFirebaseRequest } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const decodedToken = await verifyFirebaseRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    // Check Stripe status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'active') {
      const userRef = dbAdmin.collection('users').doc(decodedToken.uid);
      await userRef.update({
        subscriptionStatus: 'active',
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ active: true });
    }

    return NextResponse.json({ active: false, status: subscription.status });
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}
