#!/usr/bin/env python3
"""
Demonstration of the new ADK agent execution pattern
Shows the improved event handling and response processing
"""
import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from adk_config import adk_config
    from google.adk.agents import Agent
    from google.genai import types
    print("✓ Successfully imported ADK components")
except ImportError as e:
    print(f"✗ Failed to import ADK components: {e}")
    print("Make sure you have installed the requirements and set up your environment variables")
    sys.exit(1)

# Define a simple tool for demonstration
def get_goal_advice(goal_description: str) -> str:
    """Simple tool that provides goal advice"""
    return f"For the goal '{goal_description}', I recommend breaking it down into smaller, measurable steps with specific deadlines."

async def demonstrate_new_pattern():
    """Demonstrate the new ADK agent execution pattern"""
    print("Demonstrating New ADK Agent Execution Pattern")
    print("=" * 50)
    
    # Create a simple demonstration agent
    demo_agent = Agent(
        name="demo_goal_advisor",
        model="gemini-2.0-flash",
        description="Provides advice on goal planning and achievement",
        instruction="You are a helpful goal planning assistant. Use the get_goal_advice tool when appropriate to provide structured advice.",
        tools=[get_goal_advice]
    )
    
    print(f"✓ Created demo agent: {demo_agent.name}")
    
    # Test queries to demonstrate the pattern
    test_queries = [
        "I want to learn Spanish fluently",
        "Help me plan to run a marathon",
        "I need to save money for a house"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n--- Test {i} ---")
        try:
            # Use the updated async execution method
            response = await adk_config.execute_agent_async(
                agent=demo_agent,
                user_input=query,
                user_id="demo_user",
                session_id=f"demo_session_{i}"
            )
            
            print(f"Final response received: {response[:100]}..." if len(response) > 100 else f"Final response received: {response}")
            
        except Exception as e:
            print(f"✗ Error in test {i}: {e}")
    
    print("\n" + "=" * 50)
    print("Pattern Demonstration Complete!")
    print("\nKey improvements shown:")
    print("1. Clear query/response logging with >>> and <<<")
    print("2. Proper event iteration and final response detection")
    print("3. Error handling for escalations and edge cases")
    print("4. Consistent async execution pattern across all agents")
    print("5. Both async and sync wrapper methods available")

async def demonstrate_conversation_flow():
    """Demonstrate a multi-turn conversation using the new pattern"""
    print("\n" + "=" * 50)
    print("Demonstrating Multi-Turn Conversation Flow")
    print("=" * 50)
    
    # Create a conversational agent
    conversation_agent = Agent(
        name="conversation_goal_planner",
        model="gemini-2.0-flash",
        description="Engages in multi-turn conversations about goal planning",
        instruction="You are a conversational goal planning assistant. Remember previous context and build upon it in conversations.",
        tools=[get_goal_advice]
    )
    
    # Simulate a conversation
    conversation_queries = [
        "I want to improve my fitness",
        "What specific exercises should I focus on?",
        "How often should I work out per week?",
        "What if I can only spare 30 minutes per day?"
    ]
    
    session_id = "conversation_demo"
    user_id = "conversation_user"
    
    for i, query in enumerate(conversation_queries, 1):
        print(f"\n--- Conversation Turn {i} ---")
        try:
            response = await adk_config.execute_agent_async(
                agent=conversation_agent,
                user_input=query,
                user_id=user_id,
                session_id=session_id  # Same session for conversation continuity
            )
            
            print(f"Response length: {len(response)} characters")
            
        except Exception as e:
            print(f"✗ Error in conversation turn {i}: {e}")
    
    print("\n" + "=" * 50)
    print("Conversation Flow Demonstration Complete!")
    print("Notice how the same session_id maintains conversation context")

async def main():
    """Run all demonstrations"""
    try:
        await demonstrate_new_pattern()
        await demonstrate_conversation_flow()
        
        print("\n" + "=" * 60)
        print("All demonstrations completed successfully!")
        print("The new pattern provides better visibility into agent execution")
        print("and more robust error handling for production use.")
        
    except Exception as e:
        print(f"Demonstration failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDemonstration interrupted by user")
    except Exception as e:
        print(f"Failed to run demonstration: {e}")