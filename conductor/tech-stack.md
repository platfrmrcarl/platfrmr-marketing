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

## 3. ADK Multi-Agent System (Python)
- **Framework:** `google-adk`
- **Models:** Gemini 1.5 Pro
- **Tools:** `GoogleSearchTool`, custom LinkedIn API tool.
- **Environment:** Python 3.10+ (managed with a virtual environment).

## 4. Infrastructure & Integration
- **Deployment:** Vercel (for Next.js app)
- **Execution Bridge:** Next.js API route triggers the Python agents via a subprocess or microservice call.
- **Scheduling:** Next.js Cron or external scheduler to trigger daily agent execution.
