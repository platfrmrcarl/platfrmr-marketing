# Tech Stack: LinkedIn Auto-Marketer SaaS

## 1. Frontend
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Vanilla CSS (CSS Variables, Flexbox/Grid, CSS Modules)
- **Components:** React (Hooks)

## 2. Backend
- **Authentication:** NextAuth.js (Firebase adapter or standard OAuth logic)
- **Database:** Firebase Firestore
- **Payments:** Stripe (Checkout, Billing, Webhooks)
- **Serverless Functions:** Next.js API Routes (Route Handlers)

### 2.1. Data Schema (Firestore)
- **`users/{userId}`:**
  - `name`: string
  - `email`: string
  - `isSubscribed`: boolean
  - `stripeCustomerId`: string
  - `preferences`: { `target_niche`, `target_audience`, `target_topics`, `preferred_hashtags` }
  - `integrations`: { `linkedin`: { `access_token`, `user_urn` } }

## 3. ADK Multi-Agent System (TypeScript)
- **Framework:** `@google/adk`
- **Models:** Gemini 2.5 Pro (Orchestrator, Researcher, Writer), Gemini 3 Flash (ImageGen), Gemini 1.5 Pro (Publisher)
- **Tools:** `GoogleSearchTool`, custom LinkedIn API tool.
- **Environment:** Integrated directly into the Next.js API routes (Serverless).

## 4. Infrastructure & Integration
- **Deployment:** Vercel (for Next.js app)
- **Execution:** Next.js API route (`/api/generate`) triggers the agents.
- **Scheduling:** Next.js Cron (`/api/cron/run-agents`) to trigger daily agent execution.
