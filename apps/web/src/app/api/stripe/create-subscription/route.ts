import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyFirebaseRequest } from '@/lib/server-auth';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const decodedToken = await verifyFirebaseRequest(req);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSnap = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const email = userSnap.data()?.email || decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
    }

    // 1. Find or create Stripe customer
    const customers = await stripe.customers.list({ email: email!, limit: 1 });
    let customer = customers.data.length > 0 ? customers.data[0] : null;

    if (!customer) {
      customer = await stripe.customers.create({ email: email! });
    }

    // 2. Create Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        // This price ID should be provided in environment variables or hardcoded for the MVP
        price: process.env.STRIPE_PRICE_ID!, 
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
