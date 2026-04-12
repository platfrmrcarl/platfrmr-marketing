# Specification: Full System Integration

## Requirements
- Provide an API endpoint for on-demand article generation.
- Implement a secure cron endpoint for automated daily runs.
- Feed user preferences (niche, topics, hashtags) into the Orchestrator.
- Pass LinkedIn tokens and URNs for automated publishing.

## Tech Stack
- **Next.js API Routes**: Execution platform.
- **Firebase Firestore**: Input source.
- **ADK Runner**: Execution engine.
