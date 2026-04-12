# Implementation Plan: Full System Integration

## Steps
1.  **API Bridge**
    - [x] Create the `/api/generate` POST route.
    - [x] Integrate `InMemoryRunner` and `getOrchestrator`.
2.  **Scheduling**
    - [x] Update the `/api/cron/run-agents` GET route.
    - [x] Implement logic to fetch all subscribed users and run their agents.
3.  **Data Flow**
    - [x] map Firestore user preference fields to agent input prompts.
    - [x] Handle LinkedIn integration tokens from the `users` collection.
