import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!process.env.STRIPE_API_ID) {
  throw new Error('STRIPE_API_ID is not defined');
}

type StripeConfig = NonNullable<ConstructorParameters<typeof Stripe>[1]>;
const stripeApiVersion = process.env.STRIPE_API_ID as StripeConfig['apiVersion'];

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: stripeApiVersion,
});
