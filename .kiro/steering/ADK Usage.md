# Google Agent Development Kit (ADK) Usage Guide

## Overview

Agent Development Kit (ADK) is a flexible and modular framework for developing and deploying AI agents. It's model-agnostic, deployment-agnostic, and designed for compatibility with other frameworks. ADK makes agent development feel more like software development.

**Important**: ADK is only available in Python and Java, not TypeScript/JavaScript. For our TypeScript React application, we need to create Python-based ADK agents that communicate with our frontend through REST APIs or other inter-process communication methods.

## Core Concepts

### Agent Architecture

#### Primary Agent Class
- **Agent**: The main agent class that orchestrates LLM interactions, tool usage, and sub-agent delegation
- **Sub-agents**: Specialized agents that can be delegated to by the main agent
- **Tools**: Functions that provide specific capabilities to agents

#### Workflow Agents (for orchestration)
- **Sequential**: Execute agents in a defined order
- **Parallel**: Run multiple agents simultaneously  
- **Loop**: Repeat agent execution based on conditions

#### Session Management
- **Runner**: Executes agents and manages conversation flow
- **SessionService**: Manages conversation state and memory (InMemorySessionService for development)
- **ToolContext**: Provides access to session state within tools

### Multi-Agent Architecture

ADK supports hierarchical multi-agent systems where:
- A root agent can delegate tasks to specialized sub-agents
- Complex coordination between specialized agents
- Modular and scalable application design
- Each agent has specific domain expertise
- Automatic delegation based on agent descriptions and user intent

## Implementation Patterns

### Basic Agent Setup (Python)
```python
# Import required classes
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.session_services import InMemorySessionService
from google.genai import types

# Define tools (regular Python functions)
def get_weather(city: str) -> dict:
    """Get weather information for a city."""
    return {"status": "success", "report": f"Weather in {city} is sunny"}

# Create the main agent
weather_agent = Agent(
    name="weather_agent",
    model="gemini-2.0-flash",  # or other model
    description="Provides weather information for cities",
    instruction="You are a weather assistant. Use the get_weather tool to provide weather information.",
    tools=[get_weather]
)

# Set up session management
session_service = InMemorySessionService()
APP_NAME = "weather_app"
USER_ID = "user_1"
SESSION_ID = "session_001"

# Create session
session = await session_service.create_session(
    app_name=APP_NAME,
    user_id=USER_ID, 
    session_id=SESSION_ID
)

# Create runner
runner = Runner(
    agent=weather_agent,
    app_name=APP_NAME,
    session_service=session_service
)

# Define Agent Interaction Function
async def call_agent_async(query: str, runner, user_id, session_id):
    """Sends a query to the agent and returns the final response."""
    print(f"\n>>> User Query: {query}")
    
    # Prepare the user's message in ADK format
    content = types.Content(role='user', parts=[types.Part(text=query)])
    
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

# Run the Conversation
async def run_conversation():
    await call_agent_async("What is the weather like in London?",
                          runner=runner,
                          user_id=USER_ID,
                          session_id=SESSION_ID)
    
    await call_agent_async("How about Paris?",
                          runner=runner,
                          user_id=USER_ID,
                          session_id=SESSION_ID)

# Execute the conversation using await in an async context (like Colab/Jupyter)
await run_conversation()

# --- OR ---
# Uncomment the following lines if running as a standard Python script (.py file):
# import asyncio
# if __name__ == "__main__":
#     try:
#         asyncio.run(run_conversation())
#     except Exception as e:
#         print(f"An error occurred: {e}")
```

### Agent API Reference

The `Agent` class has the following key properties:

- `name` (required): String identifier for the agent
- `model`: String or model instance (e.g., 'gemini-2.0-flash', 'gemini-pro')
- `description`: Description of agent's capabilities (crucial for delegation)
- `instruction`: System prompt/instruction for the agent
- `tools`: Array of tools (Python functions) available to the agent
- `sub_agents`: Array of sub-agents for delegation
- `output_key`: Key to automatically save agent responses to session state
- `before_model_callback`: Function called before LLM execution
- `before_tool_callback`: Function called before tool execution

### Agent Execution Pattern

**Correct execution flow:**
1. Create `Agent` instances (main agent and any sub-agents)
2. Set up `InMemorySessionService` and create session
3. Create `Runner` with the main agent and session service
4. Use `runner.run_async()` to execute conversations
5. Process events to get final responses

**All agents should implement both async and sync methods:**
- `async def run_async(self, input_data)` - Primary async method
- `def run(self, input_data)` - Sync wrapper that calls async method

**NOT** direct agent execution - agents are executed through runners with proper event handling.

### Installation (Python)
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows CMD:
.venv\Scripts\activate.bat
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install ADK
pip install google-adk
```

### Tool Development
Tools in ADK are regular Python functions with clear docstrings:

```python
from google.adk.tools.tool_context import ToolContext

def analyze_goal(description: str, tool_context: ToolContext) -> dict:
    """Analyze a goal description for SMART criteria.
    
    Args:
        description: The goal description to analyze
        tool_context: Context providing access to session state
        
    Returns:
        dict: Analysis results with SMART criteria assessment
    """
    # Access session state
    user_preferences = tool_context.state.get('preferences', {})
    
    # Perform analysis
    analysis = {
        'specific': 'Goal needs more specific details',
        'measurable': 'Add quantifiable metrics',
        'achievable': 'Goal appears realistic',
        'relevant': 'Aligns with user preferences',
        'time_bound': 'Add deadline or timeframe'
    }
    
    # Update session state
    tool_context.state['last_analysis'] = analysis
    
    return analysis
```

### Sub-Agent Delegation
Create specialized sub-agents for specific tasks:

```python
# Create specialized sub-agents
greeting_agent = Agent(
    name="greeting_agent",
    model="gemini-2.0-flash",
    description="Handles greetings and welcome messages",
    instruction="Provide friendly greetings using the say_hello tool",
    tools=[say_hello]
)

analysis_agent = Agent(
    name="analysis_agent", 
    model="gemini-2.0-flash",
    description="Analyzes goals for SMART criteria compliance",
    instruction="Analyze goals using the analyze_goal tool",
    tools=[analyze_goal]
)

# Create main agent with sub-agents
main_agent = Agent(
    name="goal_assistant",
    model="gemini-2.0-flash", 
    description="Main goal planning assistant",
    instruction="Help users with goal planning. Delegate greetings to greeting_agent and analysis to analysis_agent.",
    tools=[create_goal, update_goal],
    sub_agents=[greeting_agent, analysis_agent]
)
```

### Session State Management
Use session state for memory and personalization:

```python
# Initialize session with state
session = await session_service.create_session(
    app_name=APP_NAME,
    user_id=USER_ID,
    session_id=SESSION_ID,
    initial_state={
        'user_preferences': {'temperature_unit': 'Celsius'},
        'conversation_context': {}
    }
)

# Agent with output_key to save responses
agent = Agent(
    name="weather_agent",
    model="gemini-2.0-flash",
    tools=[get_weather_stateful],
    output_key="last_weather_report"  # Automatically saves final response
)
```

## Development Best Practices

### Agent Design
- Keep agents focused on specific domains
- Design clear interfaces between agents
- Implement proper error handling and fallbacks
- Use appropriate orchestration patterns

### Tool Development
- Create reusable, well-documented tools
- Implement proper input validation
- Handle edge cases and errors gracefully
- Follow ADK tool interface standards

### Testing and Evaluation
- Use built-in evaluation framework
- Test both final responses and execution trajectories
- Create comprehensive test cases
- Evaluate against predefined criteria

## Deployment Options

### Local Development
- Run agents locally for development and testing
- Use Docker containers for consistency
- Leverage development tools and debugging

### Cloud Deployment
- **Vertex AI Agent Engine**: Scalable cloud deployment
- **Cloud Run**: Custom infrastructure deployment
- **Docker**: Containerized deployment anywhere

### Integration Patterns
- REST API endpoints for agent services
- Event-driven architectures
- Microservices integration
- Real-time streaming responses

## Safety and Security

### Security Best Practices
- Implement proper authentication and authorization
- Validate all inputs and outputs
- Use secure communication channels
- Monitor agent behavior and performance

### Safety Patterns
- Implement guardrails and safety checks
- Use content filtering and moderation
- Implement rate limiting and resource controls
- Monitor for harmful or inappropriate outputs

## Common Use Cases

### Goal Planning and Management
- Multi-agent coordination for complex goal decomposition
- Sequential workflows for SMART goal validation
- Parallel processing for multiple goal analysis
- Loop agents for iterative refinement

### Personal Assistant Features
- Specialized agents for different life domains
- Tool integration for calendar, tasks, and reminders
- Dynamic routing based on user intent
- Multi-modal capabilities for rich interactions

## Project Structure for ADK Integration

```
project/
├── src/                     # TypeScript React frontend
│   ├── services/           # API clients for Python agents
│   └── ...
├── python-agents/          # Python ADK agents
│   ├── requirements.txt    # Python dependencies
│   ├── agents/            # Individual agent implementations
│   ├── tools/             # Custom ADK tools
│   ├── app.py             # Flask/FastAPI server
│   └── .venv/             # Python virtual environment
└── ...
```

## Integration with TypeScript React Applications

Since ADK is Python-only, we need to create a bridge between our TypeScript frontend and Python ADK agents.

**All agents now support async execution patterns:**
- Primary async methods for better performance and proper ADK runner usage
- Sync wrappers for compatibility with existing code
- Proper event handling and final response detection
- Concurrent execution support for multiple agents
- Improved error handling and escalation management

### Architecture Options

#### Option 1: Python Backend Service (Recommended)
Create a Python Flask/FastAPI service that hosts ADK agents and exposes REST endpoints.

```python
# Python backend service (app.py)
import asyncio
from flask import Flask, request, jsonify
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.session_services import InMemorySessionService
from google.genai import types

app = Flask(__name__)

# Initialize session service
session_service = InMemorySessionService()

# Create goal planning agent
goal_planning_agent = Agent(
    name="goal_planning_agent",
    model="gemini-2.0-flash",
    description="Plans SMART goals from natural language input",
    instruction="You are a SMART goal planning assistant. Help users create specific, measurable, achievable, relevant, and time-bound goals.",
    tools=[analyze_goal_tool, create_smart_criteria_tool]
)

# Create runner
runner = Runner(
    agent=goal_planning_agent,
    app_name="goal_planning_app",
    session_service=session_service
)

async def execute_agent(user_input: str, user_id: str, session_id: str):
    """Execute agent and return response"""
    print(f"\n>>> User Query: {user_input}")
    
    # Prepare the user's message in ADK format
    content = types.Content(role='user', parts=[types.Part(text=user_input)])
    
    final_response_text = "Agent did not produce a final response."  # Default
    
    # Key Concept: run_async executes the agent logic and yields Events.
    # We iterate through events to find the final answer.
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
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

@app.route('/api/plan-goal', methods=['POST'])
def plan_goal():
    try:
        data = request.json
        user_input = data.get('input', '')
        user_id = data.get('user_id', 'default_user')
        session_id = data.get('session_id', 'default_session')
        
        # Create session if it doesn't exist
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            session = loop.run_until_complete(
                session_service.create_session("goal_planning_app", user_id, session_id)
            )
        except:
            pass  # Session might already exist
        
        # Execute agent
        response = loop.run_until_complete(
            execute_agent(user_input, user_id, session_id)
        )
        
        return jsonify({
            'success': True,
            'response': response,
            'agent': 'goal_planning_agent'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

```typescript
// TypeScript service layer
class GoalPlanningAgentService {
  private baseUrl = 'http://localhost:5000/api';
  
  async planGoal(userInput: string, userId: string = 'default_user'): Promise<SMARTGoal> {
    const response = await fetch(`${this.baseUrl}/plan-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: userInput,
        user_id: userId,
        session_id: `session_${userId}_${Date.now()}`
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Agent execution failed');
    }
    
    return this.parseGoalResponse(data.response);
  }
  
  private parseGoalResponse(response: string): SMARTGoal {
    // Parse the agent's response into a structured SMART goal
    // This would include extracting specific, measurable, achievable, relevant, time-bound criteria
    return {
      id: generateId(),
      title: this.extractTitle(response),
      description: response,
      specific: this.extractSpecific(response),
      measurable: this.extractMeasurable(response),
      achievable: this.extractAchievable(response),
      relevant: this.extractRelevant(response),
      timeBound: this.extractTimeBound(response),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
```

#### Option 2: Python CLI Integration
For simpler use cases, create Python scripts that can be executed from Node.js:

```python
# goal_planner.py
import sys
import json
import asyncio
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.session_services import InMemorySessionService
from google.genai import types

async def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        return
        
    user_input = sys.argv[1]
    
    # Set up agent
    agent = Agent(
        name="goal_planner",
        model="gemini-2.0-flash",
        instruction="Create a SMART goal from the user's input",
        tools=[goal_analysis_tool]
    )
    
    # Set up session and runner
    session_service = InMemorySessionService()
    await session_service.create_session("cli_app", "cli_user", "cli_session")
    
    runner = Runner(agent=agent, app_name="cli_app", session_service=session_service)
    
    # Execute
    content = types.Content(role='user', parts=[types.Part(text=user_input)])
    
    async for event in runner.run_async("cli_user", "cli_session", content):
        if event.is_final_response():
            if event.content and event.content.parts:
                result = {"success": True, "response": event.content.parts[0].text}
                print(json.dumps(result))
                return
    
    print(json.dumps({"success": False, "error": "No response generated"}))

if __name__ == '__main__':
    asyncio.run(main())
```

### Recommended Approach
For development and production, **Option 1 (Python Backend Service)** is recommended because:
- Better error handling and logging
- Persistent agent state and memory through session services
- Easier debugging and monitoring
- More scalable architecture
- Better separation of concerns
- Support for multi-agent workflows and delegation

### State Management
- Use ADK's session state for persistent memory across conversations
- Integrate agent responses with React state
- Handle asynchronous agent operations with proper loading states
- Cache agent results when appropriate using session state
- Handle network errors and retries for Python service calls
- Leverage `output_key` for automatic response persistence

### Safety and Callbacks
ADK provides powerful callback mechanisms for safety and control:

```python
# Input validation callback
def validate_input(callback_context, llm_request):
    """Validate user input before sending to LLM"""
    user_message = llm_request.contents[-1].parts[0].text
    
    if "blocked_keyword" in user_message.lower():
        # Return response to block execution
        return LlmResponse(
            contents=[types.Content(
                role='model',
                parts=[types.Part(text="I cannot process that request.")]
            )]
        )
    
    return None  # Allow execution

# Tool validation callback  
def validate_tool_args(tool, args, tool_context):
    """Validate tool arguments before execution"""
    if tool.name == "sensitive_tool" and args.get("city") == "restricted":
        return {"error": "Access to that location is restricted"}
    
    return None  # Allow tool execution

# Create agent with callbacks
agent = Agent(
    name="safe_agent",
    model="gemini-2.0-flash",
    tools=[weather_tool],
    before_model_callback=validate_input,
    before_tool_callback=validate_tool_args
)
```

## Performance Considerations

### Optimization Strategies
- Use appropriate agent orchestration patterns
- Implement caching for repeated operations
- Optimize tool selection and usage
- Monitor and profile agent performance

### Resource Management
- Implement proper cleanup and resource disposal
- Use connection pooling for external services
- Monitor memory usage and performance metrics
- Implement graceful degradation patterns

## Monitoring and Observability

### Logging and Metrics
- Implement comprehensive logging
- Track agent performance metrics
- Monitor tool usage and success rates
- Set up alerting for failures and anomalies

### Debugging and Troubleshooting
- Use ADK debugging tools and utilities
- Implement detailed error reporting
- Create reproducible test scenarios
- Monitor agent decision-making processes