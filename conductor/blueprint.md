# Project Blueprint: SaaS Next.js + Firebase + Stripe

**Role**: Expert Full-stack Developer
**Context**: Build a SaaS application with Next.js (App Router), Firebase (Auth & Firestore), and Stripe Subscriptions.

---

## Task 1: Authentication & Provider Setup
1.  Initialize a **Next.js 14+** project with Tailwind CSS and TypeScript.
2.  Configure **Firebase Client SDK**.
3.  Implement **LinkedIn Login** using `OAuthProvider` ('oidc.linkedin').
4.  Create an `AuthProvider` context to manage `user` and `profile` data (synced from Firestore).

## Task 2: Firestore User Schema
Create a synchronization mechanism where every new user gets a document in `/users/{uid}` with:
- `email`: string
- `subscriptionStatus`: 'none' | 'active'
- `stripeCustomerId`: string (optional, until created)

## Task 3: Stripe Integration (Custom Checkout)
1.  **Backend (Firebase Functions)**:
    - Create a `createSubscription` function:
        - Check if user exists.
        - Create/Get Stripe Customer.
        - Create Subscription with `payment_behavior: 'default_incomplete'` and `expand: ['latest_invoice.payment_intent']`.
        - Return `clientSecret`.
    - Create a `stripeWebhook` function:
        - Listen for `invoice.paid`.
        - Update Firestore `subscriptionStatus` to 'active'.
2.  **Frontend (Stripe Elements)**:
    - Wrap the checkout page with `Elements` provider.
    - Use `PaymentElement` for the custom UI.

## Task 4: Conditional Routing Logic
Implement logic in the root layout or a protected group `(dashboard)`:
- **Condition A**: If not authenticated -> Redirect to `/login`.
- **Condition B**: If authenticated BUT `subscriptionStatus !== 'active'` -> Force stay on `/checkout`.
- **Condition C**: If authenticated AND `subscriptionStatus === 'active'` -> Allow access to `/dashboard`.

---

## File Structure Instructions
Generate the following files:
1. `lib/firebase.ts` - Client SDK config.
2. `hooks/useAuth.tsx` - Auth state + Firestore profile data.
3. `app/checkout/page.tsx` - Custom Stripe PaymentElement implementation.
4. `functions/index.js` - Stripe subscription and Webhook logic.
5. `agents/orchestrator.ts` - Agent to run the linkedin posting using linkedin api