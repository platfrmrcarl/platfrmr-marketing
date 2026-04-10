# SaaS Implementation Guide: Web App Core (`apps/web/`)

## 1. Authentication (NextAuth.js + Firebase)
* Configure `next-auth` inside `apps/web/app/api/auth/[...nextauth]/route.ts`.
* **Crucial:** Intercept the LinkedIn `access_token`. Write this token securely to Firebase Firestore under `users/{userId}/integrations/linkedin`.

## 2. Onboarding Flow
* Create a multi-step form at `apps/web/app/onboarding/page.tsx`.
* Collect `target_niche`, `target_audience`, `target_topics`, and `preferred_hashtags`. Save to Firestore.

## 3. Stripe Custom Checkout
* **Backend (`apps/web/app/api/stripe/create-subscription/route.ts`):** Create a Stripe Customer and a Subscription with `payment_behavior: 'default_incomplete'`. Return the `client_secret`.
* **Frontend (`apps/web/app/checkout/page.tsx`):** Render the `PaymentElement` for a white-labeled checkout experience.
* **Webhooks (`apps/web/app/api/stripe/webhook/route.ts`):** Listen for `invoice.payment_succeeded` and update the user's Firestore document `isSubscribed` flag to `true`.

## 4. Cron Execution
* Endpoint at `apps/web/app/api/cron/run-agents/route.ts`.
* Query Firestore for all users where `isSubscribed == true`.
* Make a POST request to the local/deployed Python API (running from the `agents/` directory), passing the user's configuration and LinkedIn token.