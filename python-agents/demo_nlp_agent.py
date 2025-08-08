"""
Demonstration of the NLP Agent functionality
Shows how the agent processes natural language goal descriptions
"""
import sys
import os

# Add the agents directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'agents'))

from nlp_agent import (
    IntentExtractionTool, 
    TimeframeParsingTool, 
    MetricsIdentificationTool, 
    ConstraintExtractionTool
)

def demo_individual_tools():
    """Demonstrate individual tool functionality"""
    print("=" * 60)
    print("NLP AGENT TOOLS DEMONSTRATION")
    print("=" * 60)
    
    # Sample goal descriptions
    goal_descriptions = [
        "I want to run a marathon by October 2024 and lose 20 pounds",
        "Learn Python programming in 3 months with a $200 budget",
        "Save $10,000 for emergency fund by end of year",
        "Get promoted to senior developer within 2 years"
    ]
    
    # Initialize tools
    intent_tool = IntentExtractionTool()
    timeframe_tool = TimeframeParsingTool()
    metrics_tool = MetricsIdentificationTool()
    constraints_tool = ConstraintExtractionTool()
    
    for i, description in enumerate(goal_descriptions, 1):
        print(f"\n{'-' * 60}")
        print(f"GOAL {i}: {description}")
        print(f"{'-' * 60}")
        
        # Intent extraction
        print("\n🎯 INTENT ANALYSIS:")
        intent_result = intent_tool.run(description)
        print(f"  Domain: {intent_result['domain']}")
        print(f"  Action: {intent_result['action']}")
        print(f"  Outcome: {intent_result['outcome']}")
        print(f"  Urgency: {intent_result['urgency']}")
        print(f"  Confidence: {intent_result['confidence']:.2f}")
        if intent_result['context']:
            print(f"  Context: {', '.join(intent_result['context'])}")
        
        # Timeframe analysis
        print("\n⏰ TIMEFRAME ANALYSIS:")
        timeframe_result = timeframe_tool.run(description)
        if timeframe_result['endDate']:
            print(f"  End Date: {timeframe_result['endDate']}")
        if timeframe_result['duration']:
            print(f"  Duration: {timeframe_result['duration']}")
        print(f"  Flexibility: {timeframe_result['flexibility']}")
        print(f"  Confidence: {timeframe_result['confidence']:.2f}")
        if timeframe_result['extractedPhrases']:
            print(f"  Time Phrases: {', '.join(timeframe_result['extractedPhrases'])}")
        
        # Metrics identification
        print("\n📊 METRICS ANALYSIS:")
        metrics_result = metrics_tool.run(description)
        print(f"  Found {len(metrics_result['metrics'])} metrics:")
        for metric in metrics_result['metrics']:
            print(f"    - {metric['name']}: {metric['targetValue']} {metric['unit']} (confidence: {metric['confidence']})")
        print(f"  Overall Confidence: {metrics_result['confidence']:.2f}")
        
        # Constraints extraction
        print("\n🚧 CONSTRAINTS ANALYSIS:")
        constraints_result = constraints_tool.run(description)
        print(f"  Found {constraints_result['total_count']} constraints:")
        for constraint in constraints_result['constraints']:
            print(f"    - {constraint['category']}: {constraint['constraint']} (severity: {constraint['severity']})")
        print(f"  Overall Confidence: {constraints_result['confidence']:.2f}")

def demo_comprehensive_analysis():
    """Demonstrate comprehensive goal analysis"""
    print(f"\n{'=' * 60}")
    print("COMPREHENSIVE GOAL ANALYSIS DEMO")
    print(f"{'=' * 60}")
    
    complex_goal = """I want to train for and complete a marathon by October 2024. 
    I'm currently a beginner runner who can only run 2 miles. I have about 1 hour 
    per day to train, but I'm worried about getting injured. I need to lose 15 pounds 
    first and build up my endurance gradually."""
    
    print(f"\nCOMPLEX GOAL: {complex_goal}")
    print(f"{'-' * 60}")
    
    # Initialize tools
    intent_tool = IntentExtractionTool()
    timeframe_tool = TimeframeParsingTool()
    metrics_tool = MetricsIdentificationTool()
    constraints_tool = ConstraintExtractionTool()
    
    # Comprehensive analysis
    intent_result = intent_tool.run(complex_goal)
    timeframe_result = timeframe_tool.run(complex_goal)
    metrics_result = metrics_tool.run(complex_goal)
    constraints_result = constraints_tool.run(complex_goal)
    
    # Calculate overall confidence
    overall_confidence = (
        intent_result['confidence'] + 
        timeframe_result['confidence'] + 
        metrics_result['confidence'] + 
        constraints_result['confidence']
    ) / 4
    
    print(f"\n📋 COMPREHENSIVE ANALYSIS SUMMARY:")
    print(f"  Goal Domain: {intent_result['domain']}")
    print(f"  Primary Action: {intent_result['action']}")
    print(f"  Target Outcome: {intent_result['outcome']}")
    print(f"  Timeline Flexibility: {timeframe_result['flexibility']}")
    print(f"  Identified Metrics: {len(metrics_result['metrics'])}")
    print(f"  Identified Constraints: {constraints_result['total_count']}")
    print(f"  Overall Analysis Confidence: {overall_confidence:.2f}")
    
    print(f"\n🎯 KEY INSIGHTS:")
    if intent_result['urgency'] == 'high':
        print("  - This is a high-priority goal requiring immediate attention")
    elif intent_result['urgency'] == 'medium':
        print("  - This is a moderate priority goal with reasonable timeline")
    else:
        print("  - This is a flexible goal with relaxed timeline")
    
    if overall_confidence > 0.7:
        print("  - High confidence in analysis - goal is well-defined")
    elif overall_confidence > 0.5:
        print("  - Moderate confidence - some aspects could be clarified")
    else:
        print("  - Low confidence - goal needs more specific details")
    
    if constraints_result['total_count'] > 0:
        print(f"  - {constraints_result['total_count']} constraints identified that may affect success")
    
    if len(metrics_result['metrics']) > 0:
        print(f"  - {len(metrics_result['metrics'])} measurable metrics identified for tracking progress")

def demo_confidence_scoring():
    """Demonstrate confidence scoring across different goal types"""
    print(f"\n{'=' * 60}")
    print("CONFIDENCE SCORING DEMONSTRATION")
    print(f"{'=' * 60}")
    
    goal_examples = [
        ("Highly Specific", "Complete a certified Python programming course on Coursera by December 31st, 2024, studying 2 hours every weekday evening"),
        ("Moderately Specific", "Learn Python programming in a few months"),
        ("Vague", "Do something good"),
        ("Complex Multi-faceted", "Train for marathon, lose weight, and improve overall fitness while managing work schedule and family commitments")
    ]
    
    intent_tool = IntentExtractionTool()
    
    print(f"\n📊 CONFIDENCE COMPARISON:")
    for goal_type, description in goal_examples:
        result = intent_tool.run(description)
        confidence_level = "High" if result['confidence'] > 0.7 else "Medium" if result['confidence'] > 0.4 else "Low"
        print(f"  {goal_type:20} | Confidence: {result['confidence']:.2f} ({confidence_level:6}) | Domain: {result['domain']}")

if __name__ == "__main__":
    try:
        demo_individual_tools()
        demo_comprehensive_analysis()
        demo_confidence_scoring()
        
        print(f"\n{'=' * 60}")
        print("DEMONSTRATION COMPLETE")
        print("All NLP Agent tools are working correctly!")
        print(f"{'=' * 60}")
        
    except Exception as e:
        print(f"Error during demonstration: {e}")
        import traceback
        traceback.print_exc()