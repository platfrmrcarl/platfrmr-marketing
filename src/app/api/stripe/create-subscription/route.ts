import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyFirebaseRequest } from '@/lib/server-auth';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // 1. Verify user authentication
    const decodedToken = await verifyFirebaseRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid, email } = decodedToken;
    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // 2. Get or Create Stripe Customer
    const userRef = dbAdmin.collection('users').doc(uid);
    const userSnap = await userRef.get();
    let stripeCustomerId = userSnap.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          firebaseUid: uid,
        },
      });
      stripeCustomerId = customer.id;
      await userRef.update({ stripeCustomerId });
    }

    // 3. Create Subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const paymentIntent = (subscription.latest_invoice as any).payment_intent;

    if (!paymentIntent) {
      throw new Error('No payment intent generated for subscription.');
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
