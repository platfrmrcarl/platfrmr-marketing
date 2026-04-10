import requests
from google.adk import LlmAgent, tool

@tool
def publish_to_linkedin(article_text: str, access_token: str, user_urn: str):
    """
    Publishes an article to LinkedIn using the UGC Post API.
    
    Args:
        article_text: The final text of the LinkedIn article.
        access_token: The user's LinkedIn access token.
        user_urn: The user's LinkedIn URN (e.g. '12345').
    """
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
    }
    # User URN is expected without the prefix if not provided, but the API needs the full URN.
    # We assume the caller provides the numeric ID or the full URN.
    author = f"urn:li:person:{user_urn}" if not user_urn.startswith("urn:li:") else user_urn
    
    payload = {
        "author": author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": article_text
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 201:
        raise Exception(f"LinkedIn API error: {response.status_code} - {response.text}")
    
    return {"status": "success", "response": response.json()}

def get_publisher_agent():
    return LlmAgent(
        model="gemini-1.5-pro",
        tools=[publish_to_linkedin],
        instructions="""
        Take the finalized article text and construct the correct JSON payload 
        for the LinkedIn UGC Post API. Use the provided LinkedIn `access_token` 
        and `user_urn` to execute the API call and publish the article.
        """
    )
