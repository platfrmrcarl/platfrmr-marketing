# Track Specification: Implement core SaaS foundations (LinkedIn Auth, Stripe, & Firestore Schema)

## Overview
This track focuses on building the foundational infrastructure for the SaaS platform, including authentication, user profile management, and payment integration.

## Objectives
- Initialize a Next.js 14+ project with Tailwind CSS and TypeScript.
- Configure Firebase for authentication and Firestore for data storage.
- Implement LinkedIn OAuth login.
- Define and implement the Firestore user schema.
- Integrate Stripe for custom subscription management.
- Implement conditional routing based on authentication and subscription status.

## Technical Requirements
- **Next.js 14+ (App Router)**
- **Firebase Client SDK & Admin SDK**
- **Stripe Elements & Node.js SDK**
- **TypeScript**

## Acceptance Criteria
- Users can log in using their LinkedIn accounts.
- A Firestore document is automatically created for each new user.
- Users are redirected to the checkout page if they do not have an active subscription.
- Stripe custom checkout successfully creates subscriptions and updates Firestore via webhooks.
- Authenticated users with active subscriptions can access the dashboard.
