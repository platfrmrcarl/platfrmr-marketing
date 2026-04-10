from google.adk import LlmAgent, AgentAsTool
from .researcher import get_researcher_agent
from .writer import get_writer_agent
from .publisher import get_publisher_agent

def get_orchestrator():
    researcher = get_researcher_agent()
    writer = get_writer_agent()
    publisher = get_publisher_agent()
    
    return LlmAgent(
        model="gemini-1.5-pro",
        tools=[
            AgentAsTool(researcher, name="researcher"),
            AgentAsTool(writer, name="writer"),
            AgentAsTool(publisher, name="publisher")
        ],
        instructions="""
        Coordinate the LinkedIn article generation and publishing process.
        1. Call 'researcher' with the user's niche and topics.
        2. Pass the brief to 'writer'.
        3. Pass the final article, access_token, and user_urn to 'publisher'.
        
        Ensure you maintain the user's preferences throughout the chain.
        """
    )
