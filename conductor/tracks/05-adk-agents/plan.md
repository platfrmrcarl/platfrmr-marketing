# Implementation Plan: ADK Agent System

## Steps
1.  **Agent Migration**
    - [x] Rewrite `ResearcherAgent` to use `GoogleSearchTool`.
    - [x] Rewrite `WriterAgent` to draft scannable LinkedIn posts.
    - [x] Rewrite `ImageGenAgent` to generate visual references.
    - [x] Rewrite `PublisherAgent` with a custom `FunctionTool` for LinkedIn.
2.  **Orchestration**
    - [x] Create an `Orchestrator` agent to manage the state and call sequences.
    - [x] Configure each agent's specific instructions and model settings.
3.  **Tool Development**
    - [x] Implement the `publish_to_linkedin` tool with `fetch`.
