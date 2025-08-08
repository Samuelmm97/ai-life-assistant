#!/usr/bin/env python3
"""
Test script to verify ADK integration is working correctly
"""
import json
from agents.master_orchestrator import MasterOrchestratorAgent
from agents.goal_planning_agent import GoalPlanningAgent
from agents.goal_analysis_agent import GoalAnalysisAgent
from agents.smart_criteria_agent import SMARTCriteriaAgent

def test_agent_initialization():
    """Test that all agents can be initialized"""
    print("Testing agent initialization...")
    
    try:
        # Test individual agents
        goal_planning = GoalPlanningAgent()
        print(f"✓ GoalPlanningAgent initialized: {goal_planning.agent_name}")
        
        goal_analysis = GoalAnalysisAgent()
        print(f"✓ GoalAnalysisAgent initialized: {goal_analysis.agent_name}")
        
        smart_criteria = SMARTCriteriaAgent()
        print(f"✓ SMARTCriteriaAgent initialized: {smart_criteria.agent_name}")
        
        # Test master orchestrator
        master = MasterOrchestratorAgent()
        print(f"✓ MasterOrchestratorAgent initialized: {master.agent_name}")
        
        return True
    except Exception as e:
        print(f"✗ Agent initialization failed: {e}")
        return False

def test_agent_capabilities():
    """Test that agents report their capabilities"""
    print("\nTesting agent capabilities...")
    
    try:
        agents = [
            GoalPlanningAgent(),
            GoalAnalysisAgent(),
            SMARTCriteriaAgent(),
            MasterOrchestratorAgent()
        ]
        
        for agent in agents:
            capabilities = agent.get_capabilities()
            print(f"✓ {agent.agent_name} capabilities: {len(capabilities)} items")
            for cap in capabilities[:3]:  # Show first 3 capabilities
                print(f"  - {cap}")
        
        return True
    except Exception as e:
        print(f"✗ Capabilities test failed: {e}")
        return False

def test_basic_goal_creation():
    """Test basic goal creation workflow"""
    print("\nTesting basic goal creation...")
    
    try:
        master = MasterOrchestratorAgent()
        
        # Test goal creation workflow
        result = master.run({
            'action': 'create_goal',
            'input': 'I want to learn Python programming'
        })
        
        if result.get('success'):
            print("✓ Goal creation workflow completed successfully")
            print(f"  - Workflow type: {result.get('workflow_type')}")
            if 'goal' in result:
                goal = result['goal']
                if isinstance(goal, dict) and 'goal' in goal:
                    goal = goal['goal']
                print(f"  - Goal title: {goal.get('title', 'N/A')}")
                print(f"  - Goal category: {goal.get('category', 'N/A')}")
        else:
            print(f"✗ Goal creation failed: {result.get('error', 'Unknown error')}")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Goal creation test failed: {e}")
        return False

def test_agent_info():
    """Test agent information retrieval"""
    print("\nTesting agent information...")
    
    try:
        agents = [
            GoalPlanningAgent(),
            GoalAnalysisAgent(),
            SMARTCriteriaAgent(),
            MasterOrchestratorAgent()
        ]
        
        for agent in agents:
            info = agent.get_agent_info()
            print(f"✓ {agent.agent_name} info:")
            print(f"  - Agent ID: {info.get('agent_id', 'N/A')[:8]}...")
            print(f"  - Capabilities: {len(info.get('capabilities', []))}")
            print(f"  - Tools: {len(info.get('tools', []))}")
        
        return True
    except Exception as e:
        print(f"✗ Agent info test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("ADK Integration Test Suite")
    print("=" * 50)
    
    tests = [
        test_agent_initialization,
        test_agent_capabilities,
        test_agent_info,
        test_basic_goal_creation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ADK integration is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    exit(main())