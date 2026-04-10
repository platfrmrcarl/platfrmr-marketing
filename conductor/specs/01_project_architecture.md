# Project Overview: LinkedIn Auto-Marketer SaaS

## 1. Core Value Proposition
A $20/month SaaS platform that automatically researches, writes, and publishes expert-level LinkedIn articles tailored to a user's specific niche, audience, and preferred topics using a multi-agent AI system.

## 2. Tech Stack Definitions
* **Web App (`apps/web/`):** Next.js (App Router), React, Tailwind CSS.
* **Database & Auth (`apps/web/lib/`):** Firebase (Firestore for data storage, NextAuth.js / Firebase Auth for Google & LinkedIn OAuth).
* **Payments (`apps/web/`):** Stripe (Stripe Billing for $20/mo subscriptions + Stripe Elements for a custom on-site checkout page).
* **AI Orchestration (`agents/`):** Python via Google Agent Development Kit (ADK) (`google-adk`). Exposed as a local API endpoint to communicate with the web app.
* **External APIs:** LinkedIn Community Management API (for posting), Google Search Tool (for research).

## 3. Data Flow & User Journey
1. **Auth:** User logs in via Google or LinkedIn.
2. **Subscription:** User completes custom Stripe Checkout for a $20/mo subscription.
3. **Onboarding:** User submits preferences (`target_niche`, `target_audience`, `target_topics`, `preferred_hashtags`).
4. **Token Management:** LinkedIn `access_token` is captured and stored securely in Firebase Firestore.
5. **Execution Trigger:** A serverless Next.js CRON route in `apps/web/` triggers the Python ADK application inside `agents/` via an HTTP request.