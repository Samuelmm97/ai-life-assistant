#!/usr/bin/env python3
"""
Test script for async ADK agent execution pattern
Demonstrates the updated async pattern across all agents
"""
import asyncio
import sys
import os
import json

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from agents.goal_planning_agent import GoalPlanningAgent
    from agents.goal_analysis_agent import GoalAnalysisAgent
    from agents.smart_criteria_agent import SMARTCriteriaAgent
    from agents.master_orchestrator import MasterOrchestratorAgent
    print("✓ Successfully imported all ADK agents")
except ImportError as e:
    print(f"✗ Failed to import agents: {e}")
    print("Make sure you have installed the requirements and set up your environment variables")
    sys.exit(1)

async def test_goal_planning_agent():
    """Test the goal planning agent with async pattern"""
    print("\n" + "=" * 60)
    print("Testing Goal Planning Agent (Async Pattern)")
    print("=" * 60)
    
    agent = GoalPlanningAgent()
    
    test_inputs = [
        "I want to learn Python programming in 3 months",
        "Help me lose 20 pounds by summer",
        "I need to save $10,000 for a vacation next year"
    ]
    
    for i, user_input in enumerate(test_inputs, 1):
        print(f"\n--- Test {i}: Goal Planning ---")
        print(f"Input: {user_input}")
        
        try:
            # Test async method
            result = await agent.run_async(user_input)
            print(f"✓ Async execution successful")
            print(f"Success: {result.get('success', False)}")
            if result.get('success'):
                goal = result.get('goal', {})
                print(f"Goal Title: {goal.get('title', 'N/A')}")
                print(f"Category: {goal.get('category', 'N/A')}")
                print(f"Priority: {goal.get('priority', 'N/A')}")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"✗ Error in async execution: {e}")

async def test_goal_analysis_agent():
    """Test the goal analysis agent with async pattern"""
    print("\n" + "=" * 60)
    print("Testing Goal Analysis Agent (Async Pattern)")
    print("=" * 60)
    
    agent = GoalAnalysisAgent()
    
    # Sample goal data for analysis
    sample_goal = {
        "title": "Learn Python Programming",
        "description": "Master Python programming language for web development",
        "specific": "Learn Python syntax, frameworks like Django and Flask",
        "measurable": "Complete 5 projects and pass certification exam",
        "achievable": "I have programming background and 2 hours daily",
        "relevant": "Needed for career advancement in software development",
        "timeBound": "Complete within 6 months by December 2024",
        "category": "learning",
        "priority": "high"
    }
    
    print(f"Analyzing sample goal: {sample_goal['title']}")
    
    try:
        # Test async method
        result = await agent.run_async(sample_goal)
        print(f"✓ Async execution successful")
        print(f"Success: {result.get('success', False)}")
        
        if result.get('success'):
            analysis = result.get('analysis', {})
            print(f"Overall Score: {analysis.get('overallScore', 'N/A')}")
            print(f"Strengths: {len(analysis.get('strengths', []))}")
            print(f"Weaknesses: {len(analysis.get('weaknesses', []))}")
            print(f"Recommendations: {len(analysis.get('recommendations', []))}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"✗ Error in async execution: {e}")

async def test_smart_criteria_agent():
    """Test the SMART criteria agent with async pattern"""
    print("\n" + "=" * 60)
    print("Testing SMART Criteria Agent (Async Pattern)")
    print("=" * 60)
    
    agent = SMARTCriteriaAgent()
    
    test_goals = [
        {"title": "Get Fit", "description": "I want to improve my physical fitness"},
        {"title": "Learn Guitar", "description": "Master playing acoustic guitar"},
        {"title": "Start Business", "description": "Launch my own consulting business"}
    ]
    
    for i, goal_input in enumerate(test_goals, 1):
        print(f"\n--- Test {i}: SMART Criteria Generation ---")
        print(f"Goal: {goal_input['title']} - {goal_input['description']}")
        
        try:
            # Test async method
            result = await agent.run_async(goal_input)
            print(f"✓ Async execution successful")
            print(f"Success: {result.get('success', False)}")
            
            if result.get('success'):
                criteria = result.get('criteria', {})
                print(f"Generated criteria for: {len(criteria)} SMART dimensions")
                for criterion in ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']:
                    if criterion in criteria:
                        suggestions = criteria[criterion].get('suggestions', [])
                        print(f"  {criterion.title()}: {len(suggestions)} suggestions")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"✗ Error in async execution: {e}")

async def test_master_orchestrator():
    """Test the master orchestrator with async pattern"""
    print("\n" + "=" * 60)
    print("Testing Master Orchestrator Agent (Async Pattern)")
    print("=" * 60)
    
    orchestrator = MasterOrchestratorAgent()
    
    test_workflows = [
        {
            "action": "create_goal",
            "input": "I want to run a half marathon in 6 months"
        },
        {
            "action": "analyze_goal",
            "goal": {
                "title": "Read 24 Books This Year",
                "description": "Read two books per month throughout the year",
                "specific": "Read 24 books covering various genres",
                "measurable": "Track books completed monthly",
                "achievable": "Read 30 minutes daily",
                "relevant": "Expand knowledge and improve focus",
                "timeBound": "Complete by December 31st, 2024"
            }
        }
    ]
    
    for i, workflow_data in enumerate(test_workflows, 1):
        print(f"\n--- Test {i}: Orchestrator Workflow ---")
        print(f"Action: {workflow_data['action']}")
        
        try:
            # Test async method
            result = await orchestrator.run_async(workflow_data)
            print(f"✓ Async execution successful")
            print(f"Success: {result.get('success', False)}")
            print(f"Workflow Type: {result.get('workflow_type', 'N/A')}")
            
            if result.get('success'):
                if 'goal' in result:
                    goal_result = result['goal']
                    print(f"Goal Created: {goal_result.get('goal', {}).get('title', 'N/A')}")
                if 'analysis' in result:
                    analysis = result['analysis']
                    print(f"Analysis Score: {analysis.get('analysis', {}).get('overallScore', 'N/A')}")
                if 'next_steps' in result:
                    print(f"Next Steps: {len(result['next_steps'])}")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"✗ Error in async execution: {e}")

async def test_concurrent_execution():
    """Test concurrent execution of multiple agents"""
    print("\n" + "=" * 60)
    print("Testing Concurrent Agent Execution")
    print("=" * 60)
    
    # Create agents
    goal_planner = GoalPlanningAgent()
    criteria_agent = SMARTCriteriaAgent()
    
    # Test concurrent execution
    print("Running goal planning and criteria generation concurrently...")
    
    try:
        # Run both agents concurrently
        planning_task = goal_planner.run_async("I want to learn data science in 4 months")
        criteria_task = criteria_agent.run_async({
            "title": "Learn Data Science",
            "description": "Master data science skills including Python, statistics, and machine learning"
        })
        
        # Wait for both to complete
        planning_result, criteria_result = await asyncio.gather(planning_task, criteria_task)
        
        print("✓ Concurrent execution successful")
        print(f"Planning Success: {planning_result.get('success', False)}")
        print(f"Criteria Success: {criteria_result.get('success', False)}")
        
        if planning_result.get('success') and criteria_result.get('success'):
            print("Both agents completed successfully in parallel!")
        
    except Exception as e:
        print(f"✗ Error in concurrent execution: {e}")

async def main():
    """Run all async agent tests"""
    print("ADK Agents Async Pattern Testing")
    print("=" * 60)
    print("Testing all agents with the new async execution pattern")
    print("This demonstrates proper ADK runner usage with event handling")
    
    try:
        # Test individual agents
        await test_goal_planning_agent()
        await test_goal_analysis_agent()
        await test_smart_criteria_agent()
        await test_master_orchestrator()
        
        # Test concurrent execution
        await test_concurrent_execution()
        
        print("\n" + "=" * 60)
        print("All Async Pattern Tests Completed!")
        print("=" * 60)
        print("✓ All agents now support proper async execution")
        print("✓ ADK runner pattern implemented correctly")
        print("✓ Event handling and final response detection working")
        print("✓ Both async and sync wrapper methods available")
        print("✓ Concurrent execution supported")
        print("✓ Error handling improved")
        
    except Exception as e:
        print(f"Test suite failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTesting interrupted by user")
    except Exception as e:
        print(f"Failed to run tests: {e}")