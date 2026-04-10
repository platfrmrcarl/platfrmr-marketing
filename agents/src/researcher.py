from google.adk import LlmAgent, GoogleSearchTool

def get_researcher_agent():
    return LlmAgent(
        model="gemini-1.5-pro",
        tools=[GoogleSearchTool()],
        instructions="""
        You are an expert Niche Analyst. Use the Google Search tool to find 
        trending, highly engaging angles and recent data points based on 
        the user's `target_topics` and `target_niche`. 
        Return a structured Research Brief containing verifiable facts.
        """
    )
