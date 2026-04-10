# Workflow: LinkedIn Auto-Marketer SaaS

## 1. Development Process
1.  **Frontend/Backend Shell:** Set up Next.js, Firebase Auth, and basic layout.
2.  **Onboarding & Firestore:** Implement data collection and storage.
3.  **Stripe Integration:** Add checkout and webhook logic.
4.  **ADK Agents:** Build the Python-based agent system.
5.  **Integration:** Connect the Next.js cron/trigger to the Python backend.
6.  **Polishing:** Apply Vanilla CSS styling and final visual touches.

## 2. Integration Strategy
- **Next.js to Python:** A Next.js API route (`/api/cron/run-agents`) is triggered. This route queries Firestore for subscribed users and initiates the Python ADK agents for each user.
- **Python to LinkedIn:** The Python publisher agent uses a custom tool built on top of the LinkedIn UGC Post API to post content.
- **Error Handling:** Errors in the Python agent system are logged and reported back to the Next.js dashboard.

## 3. Deployment Flow
- **Next.js App:** Deployed to Vercel.
- **Python Backend:** Deployed as a separate microservice or integrated into the Vercel deployment if feasible (e.g., using Python Runtime or a separate containerized service).
- **Environment Variables:** Securely managed via Vercel and local `.env` files.
