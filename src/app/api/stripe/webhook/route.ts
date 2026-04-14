import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbAdmin } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Handle specific events to update subscription status
    if (
      event.type === 'invoice.paid' || 
      event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated'
    ) {
      const session = event.data.object as any;
      const stripeCustomerId = session.customer;

      if (stripeCustomerId) {
        const userQuery = await dbAdmin
          .collection('users')
          .where('stripeCustomerId', '==', stripeCustomerId)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'active',
            updatedAt: new Date().toISOString(),
          });
          console.log(`Updated subscription status to active for customer: ${stripeCustomerId}`);
        } else {
          console.warn(`No user found for Stripe customer: ${stripeCustomerId}`);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const session = event.data.object as any;
      const stripeCustomerId = session.customer;

      if (stripeCustomerId) {
        const userQuery = await dbAdmin
          .collection('users')
          .where('stripeCustomerId', '==', stripeCustomerId)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'none',
            updatedAt: new Date().toISOString(),
          });
          console.log(`Updated subscription status to none for customer: ${stripeCustomerId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
