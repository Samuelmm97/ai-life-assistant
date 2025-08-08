"""
Test script for the corrected ADK Goal Planning Agent
"""
import asyncio
import json
from agents.corrected_goal_planning_agent import GoalPlanningAgentService

async def test_goal_planning():
    """Test the corrected goal planning agent"""
    print("Testing Corrected ADK Goal Planning Agent")
    print("=" * 50)
    
    # Initialize the service
    service = GoalPlanningAgentService()
    
    # Test goal planning
    test_input = "I want to learn Python programming and become proficient in it within 3 months"
    
    print(f"Input: {test_input}")
    print("\nProcessing...")
    
    try:
        result = await service.plan_goal(test_input, "test_user")
        
        print("\nResult:")
        print(json.dumps(result, indent=2))
        
        if result.get('success') and result.get('goal'):
            goal = result['goal']
            print(f"\nCreated Goal:")
            print(f"Title: {goal.get('title')}")
            print(f"Category: {goal.get('category')}")
            print(f"Specific: {goal.get('specific')}")
            print(f"Measurable: {goal.get('measurable')}")
            print(f"Time-bound: {goal.get('timeBound')}")
            
            # Test refinement
            print("\n" + "=" * 50)
            print("Testing Goal Refinement")
            
            feedback = "Make the goal more specific about which Python topics to focus on"
            refine_result = await service.refine_goal(
                goal, 
                feedback, 
                "test_user", 
                result.get('session_id')
            )
            
            print(f"\nRefinement Result:")
            print(json.dumps(refine_result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_goal_planning())