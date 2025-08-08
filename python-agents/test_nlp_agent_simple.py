"""
Simplified tests for NLP Agent tools without ADK dependencies
Tests the core logic and tool functionality
"""
import unittest
from datetime import datetime, timedelta
import sys
import os

# Add the agents directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'agents'))

# Mock the ADK imports since we're testing the logic
class MockTool:
    def __init__(self, name, description):
        self.name = name
        self.description = description

class MockLlmAgent:
    def __init__(self, name, description, model, system_prompt, tools):
        self.name = name
        self.description = description
        self.model = model
        self.system_prompt = system_prompt
        self.tools = tools

# Patch the imports
import nlp_agent
nlp_agent.Tool = MockTool
nlp_agent.LlmAgent = MockLlmAgent

from nlp_agent import (
    IntentExtractionTool, 
    TimeframeParsingTool, 
    MetricsIdentificationTool, 
    ConstraintExtractionTool
)


class TestIntentExtractionTool(unittest.TestCase):
    """Test the Intent Extraction Tool logic"""
    
    def setUp(self):
        self.tool = IntentExtractionTool()
    
    def test_fitness_goal_extraction(self):
        """Test extraction of fitness-related goals"""
        description = "I want to run a marathon by October and lose 20 pounds"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'fitness')
        self.assertEqual(result['action'], 'run')
        self.assertIn('marathon', result['outcome'].lower())
        self.assertEqual(result['urgency'], 'medium')
        self.assertGreater(result['confidence'], 0.5)
        self.assertIsInstance(result['context'], list)
    
    def test_learning_goal_extraction(self):
        """Test extraction of learning-related goals"""
        description = "I need to learn Python programming for my new job ASAP"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'learning')
        self.assertEqual(result['action'], 'learn')
        self.assertIn('python', result['outcome'].lower())
        self.assertEqual(result['urgency'], 'high')  # ASAP indicates high urgency
        self.assertGreater(result['confidence'], 0.5)
    
    def test_career_goal_extraction(self):
        """Test extraction of career-related goals"""
        description = "Get promoted to senior developer within 2 years"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'career')
        self.assertTrue('promoted' in result['outcome'].lower() or 'senior' in result['outcome'].lower())
        self.assertEqual(result['urgency'], 'medium')
        self.assertGreater(result['confidence'], 0.4)
    
    def test_finance_goal_extraction(self):
        """Test extraction of finance-related goals"""
        description = "Save $10,000 for emergency fund by end of year"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'finance')
        self.assertEqual(result['action'], 'save')
        self.assertTrue('10000' in result['outcome'] or '10,000' in result['outcome'])
        self.assertGreater(result['confidence'], 0.5)
    
    def test_vague_goal_extraction(self):
        """Test extraction from vague descriptions"""
        description = "I want to do something"
        result = self.tool.run(description)
        
        # Should still provide reasonable defaults
        self.assertIsNotNone(result['domain'])
        self.assertIsNotNone(result['action'])
        self.assertIsNotNone(result['outcome'])
        self.assertLess(result['confidence'], 0.5)  # Low confidence for vague input
    
    def test_confidence_scoring(self):
        """Test confidence scoring accuracy"""
        # High confidence case
        detailed_description = "I want to complete a full marathon race in Boston by April 2024 to challenge myself physically and mentally"
        detailed_result = self.tool.run(detailed_description)
        
        # Low confidence case
        vague_description = "do stuff"
        vague_result = self.tool.run(vague_description)
        
        self.assertGreater(detailed_result['confidence'], vague_result['confidence'])
        self.assertGreater(detailed_result['confidence'], 0.6)
        self.assertLess(vague_result['confidence'], 0.4)


class TestTimeframeParsingTool(unittest.TestCase):
    """Test the Timeframe Parsing Tool logic"""
    
    def setUp(self):
        self.tool = TimeframeParsingTool()
    
    def test_specific_date_parsing(self):
        """Test parsing of specific dates"""
        description = "Complete project by December 15th, 2024"
        result = self.tool.run(description)
        
        self.assertIsNotNone(result['endDate'])
        self.assertGreater(len(result['extractedPhrases']), 0)
        self.assertGreater(result['confidence'], 0.5)
    
    def test_relative_date_parsing(self):
        """Test parsing of relative dates"""
        description = "Finish this in 3 weeks"
        result = self.tool.run(description)
        
        self.assertIsNotNone(result['duration'])
        self.assertEqual(result['duration']['days'], 21)  # 3 weeks = 21 days
        self.assertGreater(result['confidence'], 0.4)
    
    def test_flexibility_determination(self):
        """Test flexibility assessment"""
        # Fixed deadline
        fixed_description = "Must be completed by the deadline of March 1st"
        fixed_result = self.tool.run(fixed_description)
        self.assertEqual(fixed_result['flexibility'], 'fixed')
        
        # Flexible timeline
        flexible_description = "Complete this around summer time, approximately"
        flexible_result = self.tool.run(flexible_description)
        self.assertEqual(flexible_result['flexibility'], 'flexible')
        
        # Very flexible
        very_flexible_description = "Finish this eventually, whenever possible"
        very_flexible_result = self.tool.run(very_flexible_description)
        self.assertEqual(very_flexible_result['flexibility'], 'very_flexible')
    
    def test_no_timeframe_handling(self):
        """Test handling of descriptions without timeframes"""
        description = "Learn to play guitar"
        result = self.tool.run(description)
        
        # Should provide defaults
        self.assertIsNotNone(result['flexibility'])
        self.assertEqual(result['flexibility'], 'flexible')
        self.assertIsInstance(result['extractedPhrases'], list)


class TestMetricsIdentificationTool(unittest.TestCase):
    """Test the Metrics Identification Tool logic"""
    
    def setUp(self):
        self.tool = MetricsIdentificationTool()
    
    def test_explicit_numeric_metrics(self):
        """Test identification of explicit numeric metrics"""
        description = "Lose 15 pounds and run 5 miles daily"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should find weight and distance metrics
        metric_names = [m['name'] for m in metrics]
        self.assertTrue(any('weight' in name for name in metric_names))
        self.assertTrue(any('distance' in name for name in metric_names))
        
        # Check values
        weight_metric = next((m for m in metrics if 'weight' in m['name']), None)
        if weight_metric:
            self.assertEqual(weight_metric['targetValue'], 15.0)
    
    def test_implicit_metrics_fitness(self):
        """Test identification of implicit fitness metrics"""
        description = "Get in shape by working out regularly"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should suggest workout frequency
        metric_names = [m['name'] for m in metrics]
        self.assertTrue(any('workout' in name for name in metric_names))
    
    def test_reading_metrics(self):
        """Test identification of reading-related metrics"""
        description = "Read 12 books this year"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should find books metric
        books_metric = next((m for m in metrics if 'books' in m['name'] or 'reading' in m['name']), None)
        self.assertIsNotNone(books_metric)
        if books_metric:
            self.assertEqual(books_metric['targetValue'], 12.0)
    
    def test_confidence_scoring(self):
        """Test confidence scoring for metrics"""
        # High confidence with explicit metrics
        explicit_description = "Save $5000 and lose 20 pounds in 6 months"
        explicit_result = self.tool.run(explicit_description)
        
        # Low confidence with vague description
        vague_description = "Be better"
        vague_result = self.tool.run(vague_description)
        
        self.assertGreater(explicit_result['confidence'], vague_result['confidence'])


class TestConstraintExtractionTool(unittest.TestCase):
    """Test the Constraint Extraction Tool logic"""
    
    def setUp(self):
        self.tool = ConstraintExtractionTool()
    
    def test_time_constraints(self):
        """Test extraction of time constraints"""
        description = "I only have 2 hours per week and I'm busy with work"
        result = self.tool.run(description)
        
        constraints = result['constraints']
        time_constraints = result['categories']['time_constraints']
        
        self.assertGreater(len(time_constraints), 0)
        self.assertTrue(any('2 hours per week' in str(constraint).lower() for constraint in time_constraints))
    
    def test_resource_constraints(self):
        """Test extraction of resource constraints"""
        description = "I have a limited budget of $100 and no gym equipment"
        result = self.tool.run(description)
        
        resource_constraints = result['categories']['resource_constraints']
        self.assertGreater(len(resource_constraints), 0)
    
    def test_skill_constraints(self):
        """Test extraction of skill constraints"""
        description = "I'm a complete beginner and have never done this before"
        result = self.tool.run(description)
        
        skill_constraints = result['categories']['skill_constraints']
        self.assertGreater(len(skill_constraints), 0)
    
    def test_constraint_severity_assessment(self):
        """Test severity assessment of constraints"""
        description = "I can't afford expensive equipment and it's impossible to do this without proper training"
        result = self.tool.run(description)
        
        constraints = result['constraints']
        self.assertGreater(len(constraints), 0)
        
        # Should have different severity levels
        severities = [c['severity'] for c in constraints]
        self.assertTrue(any(s == 'high' for s in severities))
    
    def test_no_constraints(self):
        """Test handling when no constraints are found"""
        description = "I want to read a book"
        result = self.tool.run(description)
        
        # Should handle gracefully
        self.assertIsInstance(result['constraints'], list)
        self.assertIsInstance(result['categories'], dict)
        self.assertEqual(result['total_count'], len(result['constraints']))


class TestToolIntegration(unittest.TestCase):
    """Test integration between different tools"""
    
    def test_tool_consistency(self):
        """Test that tools provide consistent results"""
        description = "Run 5 miles every day for 30 days starting next Monday"
        
        intent_tool = IntentExtractionTool()
        timeframe_tool = TimeframeParsingTool()
        metrics_tool = MetricsIdentificationTool()
        
        intent_result = intent_tool.run(description)
        timeframe_result = timeframe_tool.run(description)
        metrics_result = metrics_tool.run(description)
        
        # Results should be consistent with each other
        self.assertEqual(intent_result['domain'], 'fitness')
        self.assertGreater(len(metrics_result['metrics']), 0)
        self.assertIsNotNone(timeframe_result['duration'])
    
    def test_confidence_correlation(self):
        """Test that confidence scores correlate appropriately"""
        clear_description = "Complete 10 specific programming projects by December 31st, 2024, spending 2 hours daily"
        vague_description = "do programming stuff sometime"
        
        tools = [
            IntentExtractionTool(),
            TimeframeParsingTool(),
            MetricsIdentificationTool(),
            ConstraintExtractionTool()
        ]
        
        clear_confidences = []
        vague_confidences = []
        
        for tool in tools:
            clear_result = tool.run(clear_description)
            vague_result = tool.run(vague_description)
            
            clear_confidences.append(clear_result.get('confidence', 0.5))
            vague_confidences.append(vague_result.get('confidence', 0.5))
        
        # Clear description should generally have higher confidence
        avg_clear = sum(clear_confidences) / len(clear_confidences)
        avg_vague = sum(vague_confidences) / len(vague_confidences)
        
        self.assertGreater(avg_clear, avg_vague)


if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test classes
    test_classes = [
        TestIntentExtractionTool,
        TestTimeframeParsingTool,
        TestMetricsIdentificationTool,
        TestConstraintExtractionTool,
        TestToolIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Test Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    if result.testsRun > 0:
        success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100)
        print(f"Success rate: {success_rate:.1f}%")
    print(f"{'='*50}")
    
    # Print details of any failures or errors
    if result.failures:
        print("\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")