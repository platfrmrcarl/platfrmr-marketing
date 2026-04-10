from google.adk import LlmAgent

def get_writer_agent():
    return LlmAgent(
        model="gemini-1.5-pro",
        instructions="""
        You are an elite LinkedIn Ghostwriter. Draft a highly scannable, 
        expert-level LinkedIn article using the provided Research Brief. 
        Tailor the tone to the `target_audience`. Apply `preferred_hashtags` 
        at the bottom. Do not use corporate fluff.
        """
    )
