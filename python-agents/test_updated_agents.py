#!/usr/bin/env python3
"""
Test script to verify that our agents are using the updated execution pattern
"""
import asyncio
import sys
import os

# Add the current directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from agents.goal_planning_agent import GoalPlanningAgent
    from agents.smart_criteria_agent import SMARTCriteriaAgent
    from agents.goal_analysis_agent import GoalAnalysisAgent
    print("✓ Successfully imported all agents")
except ImportError as e:
    print(f"✗ Failed to import agents: {e}")
    sys.exit(1)

async def test_goal_planning_agent():
    """Test the goal planning agent with the new execution pattern"""
    print("\n" + "="*50)
    print("Testing Goal Planning Agent")
    print("="*50)
    
    try:
        agent = GoalPlanningAgent()
        print(f"✓ Created {agent.agent_name}")
        
        test_input = "I want to learn Python programming and become proficient in web development within 6 months"
        print(f"Test input: {test_input}")
        
        result = agent.run(test_input)
        
        if result.get('success'):
            print("✓ Agent execution successful")
            goal = result.get('goal', {})
            print(f"Generated goal title: {goal.get('title', 'N/A')}")
            print(f"Goal category: {goal.get('category', 'N/A')}")
            print(f"Goal priority: {goal.get('priority', 'N/A')}")
        else:
            print(f"✗ Agent execution failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Test failed with exception: {e}")

async def test_smart_criteria_agent():
    """Test the SMART criteria agent with the new execution pattern"""
    print("\n" + "="*50)
    print("Testing SMART Criteria Agent")
    print("="*50)
    
    try:
        agent = SMARTCriteriaAgent()
        print(f"✓ Created {agent.agent_name}")
        
        test_input = {
            'title': 'Learn Python Programming',
            'description': 'I want to become proficient in Python programming for web development'
        }
        print(f"Test input: {test_input}")
        
        result = agent.run(test_input)
        
        if result.get('success'):
            print("✓ Agent execution successful")
            criteria = result.get('criteria', {})
            print(f"Generated criteria keys: {list(criteria.keys())}")
            if 'specific' in criteria:
                print(f"Specific suggestions count: {len(criteria['specific'].get('suggestions', []))}")
        else:
            print(f"✗ Agent execution failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Test failed with exception: {e}")

async def test_goal_analysis_agent():
    """Test the goal analysis agent with the new execution pattern"""
    print("\n" + "="*50)
    print("Testing Goal Analysis Agent")
    print("="*50)
    
    try:
        agent = GoalAnalysisAgent()
        print(f"✓ Created {agent.agent_name}")
        
        test_goal = {
            'title': 'Learn Python Programming',
            'description': 'I want to become proficient in Python programming for web development',
            'specific': 'Learn Python syntax and web frameworks',
            'measurable': 'Complete 5 projects',
            'achievable': 'Study 2 hours per day',
            'relevant': 'Aligns with career goals',
            'timeBound': 'Complete within 6 months'
        }
        print(f"Test input: Goal with title '{test_goal['title']}'")
        
        result = agent.run(test_goal)
        
        if result.get('success'):
            print("✓ Agent execution successful")
            analysis = result.get('analysis', {})
            print(f"Overall score: {analysis.get('overallScore', 'N/A')}")
            print(f"Analysis keys: {list(analysis.keys())}")
        else:
            print(f"✗ Agent execution failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Test failed with exception: {e}")

async def main():
    """Run all agent tests"""
    print("Testing Updated ADK Agents with New Execution Pattern")
    print("=" * 60)
    
    # Test each agent
    await test_goal_planning_agent()
    await test_smart_criteria_agent()
    await test_goal_analysis_agent()
    
    print("\n" + "="*60)
    print("Agent testing completed!")
    print("Check the output above for '>>> User Query:' and '<<< Agent Response:' messages")
    print("These indicate the new execution pattern is working correctly.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}")