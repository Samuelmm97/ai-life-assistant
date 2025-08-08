#!/usr/bin/env python3
"""
Test script for ADK agents
Run this to verify your Python environment and agents are working
"""

import sys
import json
from agents.goal_planning_agent import GoalPlanningAgent
from agents.goal_analysis_agent import GoalAnalysisAgent
from agents.smart_criteria_agent import SMARTCriteriaAgent

def test_goal_planning_agent():
    """Test the goal planning agent"""
    print("Testing Goal Planning Agent...")
    
    try:
        agent = GoalPlanningAgent()
        result = agent.run("I want to lose 20 pounds in 6 months by exercising regularly")
        
        print("✅ Goal Planning Agent working!")
        print(f"Generated goal title: {result.get('title', 'N/A')}")
        print(f"Goal category: {result.get('category', 'N/A')}")
        return True
        
    except Exception as e:
        print(f"❌ Goal Planning Agent failed: {e}")
        return False

def test_goal_analysis_agent():
    """Test the goal analysis agent"""
    print("\nTesting Goal Analysis Agent...")
    
    try:
        agent = GoalAnalysisAgent()
        
        # Sample goal for analysis
        sample_goal = {
            "title": "Lose Weight",
            "description": "I want to lose weight",
            "specific": "Lose 20 pounds",
            "measurable": "Track weight weekly",
            "achievable": "Exercise 3 times per week",
            "relevant": "Improve health",
            "timeBound": "In 6 months"
        }
        
        result = agent.run(sample_goal)
        
        print("✅ Goal Analysis Agent working!")
        print(f"Overall score: {result.get('overallScore', 'N/A')}")
        return True
        
    except Exception as e:
        print(f"❌ Goal Analysis Agent failed: {e}")
        return False

def test_smart_criteria_agent():
    """Test the SMART criteria agent"""
    print("\nTesting SMART Criteria Agent...")
    
    try:
        agent = SMARTCriteriaAgent()
        result = agent.run({
            "title": "Learn Python",
            "description": "I want to learn Python programming"
        })
        
        print("✅ SMART Criteria Agent working!")
        print(f"Specific suggestions: {len(result.get('specific', {}).get('suggestions', []))}")
        return True
        
    except Exception as e:
        print(f"❌ SMART Criteria Agent failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing ADK Agents Setup\n")
    print("=" * 50)
    
    # Check Python version
    print(f"Python version: {sys.version}")
    print("=" * 50)
    
    # Test each agent
    results = []
    results.append(test_goal_planning_agent())
    results.append(test_goal_analysis_agent())
    results.append(test_smart_criteria_agent())
    
    # Summary
    print("\n" + "=" * 50)
    print("🏁 Test Summary")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ All tests passed! ({passed}/{total})")
        print("\n🎉 Your ADK agents are ready to use!")
        print("\nNext steps:")
        print("1. Start the Flask service: python app.py")
        print("2. Start the React frontend: npm start")
        print("3. Test the integration in the web app")
    else:
        print(f"❌ Some tests failed ({passed}/{total})")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure virtual environment is activated")
        print("2. Install dependencies: pip install -r requirements.txt")
        print("3. Check Python version (3.8+ required)")
        
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)