# Monorepo Directory Structure

All code generated for this project MUST strictly adhere to the following directory structure. 

## The Web App (`apps/web/`)
All Next.js frontend code, Firebase configurations, and Stripe API routes must be generated inside the `apps/web/` directory. This acts as a standalone Next.js project.
- `apps/web/app/` (Next.js App Router: pages, layouts, API routes)
- `apps/web/components/` (React components)
- `apps/web/lib/` (Firebase init, Stripe init, utils)
- `apps/web/package.json`

## The Agent Backend (`agents/`)
All Python code utilizing the Google Agent Development Kit (ADK) must be generated inside the `agents/` directory. This acts as a standalone Python microservice.
- `agents/src/orchestrator.py`
- `agents/src/researcher.py`
- `agents/src/writer.py`
- `agents/src/publisher.py`
- `agents/main.py` (FastAPI or Flask entry point to receive the webhook from Next.js)
- `agents/requirements.txt`