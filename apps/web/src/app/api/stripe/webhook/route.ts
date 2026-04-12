import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbAdmin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as any;
    const customerEmail = invoice.customer_email;

    if (customerEmail) {
        // Update user subscription status in Firestore
        // Note: we're using email to look up the user. In a more robust app, 
        // you'd use metadata in the checkout session or customer object.
        const usersRef = dbAdmin.collection("users");
        const querySnapshot = await usersRef.where("email", "==", customerEmail).get();
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await userDoc.ref.update({
                isSubscribed: true,
                stripeCustomerId: invoice.customer,
                updatedAt: new Date().toISOString(),
            });
        }
    }
  }

  return NextResponse.json({ received: true });
}
