import os
from fastapi import FastAPI, HTTPException, Body
from src.orchestrator import get_orchestrator
import uvicorn

app = FastAPI()

@app.post("/run-workflow")
async def run_workflow(
    userId: str = Body(...),
    preferences: dict = Body(...),
    linkedin_token: str = Body(...),
    user_urn: str = Body(None) # URN can be optional if we can fetch it or if it's stored
):
    """
    Receives request from Next.js, initializes Orchestrator, and kicks off the run.
    """
    try:
        # Prompt the orchestrator to start the MAS
        input_data = f"""
        User ID: {userId}
        Niche: {preferences.get('target_niche')}
        Audience: {preferences.get('target_audience')}
        Topics: {', '.join(preferences.get('target_topics', []))}
        Hashtags: {', '.join(preferences.get('preferred_hashtags', []))}
        LinkedIn Token: {linkedin_token}
        User URN: {user_urn or 'unknown'}
        """
        
        orchestrator = get_orchestrator()
        result = orchestrator.run(input_data)
        
        return {"success": True, "result": result}
    except Exception as e:
        print(f"Error in workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
