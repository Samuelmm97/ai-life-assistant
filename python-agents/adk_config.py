"""
ADK Configuration and Setup
Centralized configuration for Google Agent Development Kit
"""
import os
import asyncio
from typing import Dict, Any, Optional
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ADKConfig:
    """Central configuration for ADK agents and workflows"""
    
    def __init__(self):
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        self.default_model = os.getenv('DEFAULT_MODEL', 'gemini-2.0-flash')
        self.agent_timeout = int(os.getenv('AGENT_TIMEOUT', 30))
        self.max_iterations = int(os.getenv('MAX_ITERATIONS', 10))
        self.temperature = float(os.getenv('TEMPERATURE', 0.7))
        self.log_level = os.getenv('ADK_LOG_LEVEL', 'INFO')
        self.app_name = "ai_life_assistant"
        
        # Initialize session service
        self.session_service = InMemorySessionService()
        
        # Validate required configuration
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
    
    def get_base_agent_config(self) -> Dict[str, Any]:
        """Get base configuration for ADK agents"""
        return {
            'model': self.default_model,
            'temperature': self.temperature,
            'timeout': self.agent_timeout,
            'max_iterations': self.max_iterations
        }
    
    def create_agent(self, name: str, description: str, instruction: str, tools: Optional[list] = None, sub_agents: Optional[list] = None) -> Agent:
        """Create a configured ADK Agent"""
        return Agent(
            name=name,
            model=self.default_model,
            description=description,
            instruction=instruction,
            tools=tools or [],
            sub_agents=sub_agents or []
        )
    
    def create_runner(self, agent: Agent) -> Runner:
        """Create a Runner for the given agent"""
        return Runner(
            agent=agent,
            app_name=self.app_name,
            session_service=self.session_service
        )
    
    async def execute_agent_async(self, agent: Agent, user_input: str, user_id: str = "default_user", session_id: str = None) -> str:
        """Execute an agent with proper session management using recommended pattern"""
        if session_id is None:
            import uuid
            session_id = f"session_{uuid.uuid4().hex[:8]}"
        
        print(f"\n>>> User Query: {user_input}")
        
        # Create session if it doesn't exist
        try:
            await self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id
            )
        except Exception:
            # Session might already exist
            pass
        
        # Create runner and execute
        runner = self.create_runner(agent)
        
        # Prepare the user's message in ADK format
        content = types.Content(role='user', parts=[types.Part(text=user_input)])
        
        final_response_text = "Agent did not produce a final response."  # Default
        
        # Key Concept: run_async executes the agent logic and yields Events.
        # We iterate through events to find the final answer.
        async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
            # You can uncomment the line below to see *all* events during execution
            # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")
            
            # Key Concept: is_final_response() marks the concluding message for the turn.
            if event.is_final_response():
                if event.content and event.content.parts:
                    # Assuming text response in the first part
                    final_response_text = event.content.parts[0].text
                elif event.actions and event.actions.escalate:  # Handle potential errors/escalations
                    final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                # Add more checks here if needed (e.g., specific error codes)
                break  # Stop processing events once the final response is found
        
        print(f"<<< Agent Response: {final_response_text}")
        return final_response_text
    
    def execute_agent_sync(self, agent: Agent, user_input: str, user_id: str = "default_user", session_id: str = None) -> str:
        """Synchronous wrapper for agent execution"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                self.execute_agent_async(agent, user_input, user_id, session_id)
            )
        finally:
            loop.close()

# Global configuration instance
adk_config = ADKConfig()