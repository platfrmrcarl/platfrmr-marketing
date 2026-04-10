# Agent Architecture: Google ADK Implementation (`agents/`)

## 1. Specialist: Researcher Agent (`agents/src/researcher.py`)
* **Class:** `LlmAgent` using `gemini-3.1-pro`.
* **Tools:** Built-in `GoogleSearchTool`.
* **Instructions:** Use Google Search to find trending, engaging angles based on `target_topics` and `target_niche`. Return a structured Research Brief.

## 2. Specialist: Writer Agent (`agents/src/writer.py`)
* **Class:** `LlmAgent` using `gemini-3.1-pro`.
* **Instructions:** Draft a scannable, expert LinkedIn article using the Research Brief. Tailor to `target_audience`. Apply `preferred_hashtags`.

## 3. Specialist: Publisher Agent (`agents/src/publisher.py`)
* **Class:** `LlmAgent` 
* **Tools:** Custom Python function tool wrapped with `@tool` that makes a POST request to the LinkedIn UGC Post API.
* **Instructions:** Construct the JSON payload and publish the finalized text using the provided LinkedIn `access_token`.

## 4. The Orchestrator (`agents/src/orchestrator.py`)
* **Class:** `LlmAgent`
* **Tools:** `[researcher_agent.as_tool(), writer_agent.as_tool(), publisher_agent.as_tool()]`
* **Workflow:** Manage the state between Research -> Writing -> Publishing.

## 5. Entry Point (`agents/main.py`)
* Create a lightweight FastAPI server with a single POST endpoint `/run-workflow`.
* This endpoint receives payloads from the Next.js app, initializes the Orchestrator, and kicks off the run.