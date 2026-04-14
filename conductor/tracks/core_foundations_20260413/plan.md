# Implementation Plan: Implement core SaaS foundations (LinkedIn Auth, Stripe, & Firestore Schema)

## Phase 1: Project Initialization & Firebase Setup [checkpoint: a9bee54]
- [x] Task: Initialize Next.js 14+ project with Tailwind CSS and TypeScript (8df3614)
    - [ ] Run `npx create-next-app@latest` with appropriate flags
    - [ ] Install dependencies: `firebase`, `stripe`, `@stripe/stripe-js`, `lucide-react`
- [x] Task: Configure Firebase Client SDK (27876a6)
    - [ ] Create `lib/firebase.ts` for client-side initialization
    - [ ] Set up environment variables for Firebase config
- [x] Task: Implement LinkedIn OAuth Login (551ebe1)
    - [ ] Configure `OAuthProvider` for LinkedIn in Firebase
    - [ ] Create `hooks/useAuth.tsx` to manage auth state
- [x] Task: Conductor - User Manual Verification 'Phase 1: Project Initialization & Firebase Setup' (Protocol in workflow.md)

## Phase 2: Firestore User Schema & Sync [checkpoint: 3a11f17]
- [x] Task: Define Firestore User Schema (fdf1fea)
    - [ ] Implement sync mechanism to create `/users/{uid}` document on first login
    - [ ] Fields: `email`, `subscriptionStatus`, `stripeCustomerId`
- [x] Task: Implement AuthProvider Context (fdf1fea)
    - [ ] Sync Firestore profile data into the `useAuth` hook
- [x] Task: Conductor - User Manual Verification 'Phase 2: Firestore User Schema & Sync' (Protocol in workflow.md)

## Phase 3: Stripe Integration (Custom Checkout) [checkpoint: 10f44c3]
- [x] Task: Setup Firebase Functions for Stripe (7e18a6b)
    - [ ] Initialize Firebase Functions
    - [ ] Implement `createSubscription` function (create/get customer, return `clientSecret`)
- [x] Task: Implement Stripe Webhook (7e18a6b)
    - [ ] Listen for `invoice.paid` and update Firestore `subscriptionStatus` to 'active'
- [x] Task: Build Stripe Elements Checkout UI (b163cba)
    - [ ] Create `app/checkout/page.tsx` with `PaymentElement`
- [x] Task: Conductor - User Manual Verification 'Phase 3: Stripe Integration (Custom Checkout)' (Protocol in workflow.md)

## Phase 4: Conditional Routing & Access Control
- [x] Task: Implement Routing Logic (317c3ed8)
    - [x] Redirect unauthenticated users to `/login`
    - [x] Redirect authenticated users without active subscription to `/products`
    - [x] Allow authenticated users with active subscription to access `/dashboard`
- [x] Task: Create Dashboard Shell (317c3ed8)
    - [x] Implement a basic `app/dashboard/page.tsx`
- [x] Task: Conductor - User Manual Verification 'Phase 4: Conditional Routing & Access Control' (Protocol in workflow.md)
