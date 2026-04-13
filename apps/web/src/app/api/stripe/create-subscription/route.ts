import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyFirebaseRequest } from '@/lib/server-auth';
import { dbAdmin } from '@/lib/firebase-admin';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const decodedToken = await verifyFirebaseRequest(req);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSnap = await dbAdmin.collection('users').doc(decodedToken.uid).get();
    const userData = userSnap.data();
    const email = userData?.email || decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
    }

    // 1. Find or create Stripe customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customer: Stripe.Customer | Stripe.DeletedCustomer = customers.data.length > 0 ? customers.data[0] : null as unknown as Stripe.Customer;

    if (!customer) {
      customer = await stripe.customers.create({ email: email });
    }

    // 2. Check for existing active subscription
    console.log('Checking for active subscriptions for customer:', customer.id);
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const activeSub = subscriptions.data[0];
      console.log('Found active subscription, syncing Firestore:', activeSub.id);
      
      // Sync Firestore so the user isn't bounced back to onboarding
      await dbAdmin.collection('users').doc(decodedToken.uid).update({
        isSubscribed: true,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: activeSub.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ 
        message: 'You already have an active subscription. Syncing your account...',
        subscriptionId: activeSub.id,
        isAlreadySubscribed: true
      }, { status: 200 });
    }

    // 3. Create Subscription
    const priceId = 'price_1TLU2bH8CSujFGCpkSQWc2oe'; // Price for prod_UK8JWmL9K9CQdW
    console.log('Creating subscription with priceId:', priceId);

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId, 
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      console.log('Subscription created:', subscription.id);

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

      if (!paymentIntent) {
        console.error('No payment intent found for subscription:', subscription.id, 'Latest invoice:', latestInvoice?.id);
        return NextResponse.json({ 
          error: 'Failed to create payment intent for subscription.',
          subscriptionId: subscription.id 
        }, { status: 500 });
      }

      console.log('Returning clientSecret for paymentIntent:', paymentIntent.id);
      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (stripeErr: unknown) {
      const message = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      console.error('Stripe Create Subscription Error:', stripeErr);
      return NextResponse.json({ error: message }, { status: 500 });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
