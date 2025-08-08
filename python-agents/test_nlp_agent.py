"""
Comprehensive tests for NLP Agent and its tools
Tests ADK agent behavior, tool usage, and confidence scoring
"""
import unittest
from datetime import datetime, timedelta
import sys
import os

# Add the agents directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'agents'))

from nlp_agent import (
    NLPAgent, 
    IntentExtractionTool, 
    TimeframeParsingTool, 
    MetricsIdentificationTool, 
    ConstraintExtractionTool
)


class TestIntentExtractionTool(unittest.TestCase):
    """Test the Intent Extraction Tool"""
    
    def setUp(self):
        self.tool = IntentExtractionTool()
    
    def test_fitness_goal_extraction(self):
        """Test extraction of fitness-related goals"""
        description = "I want to run a marathon by October and lose 20 pounds"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'fitness')
        self.assertEqual(result['action'], 'run')
        self.assertIn('marathon', result['outcome'])
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
        self.assertIn('promoted', result['outcome'].lower())
        self.assertEqual(result['urgency'], 'medium')
        self.assertGreater(result['confidence'], 0.4)
    
    def test_finance_goal_extraction(self):
        """Test extraction of finance-related goals"""
        description = "Save $10,000 for emergency fund by end of year"
        result = self.tool.run(description)
        
        self.assertEqual(result['domain'], 'finance')
        self.assertEqual(result['action'], 'save')
        self.assertIn('10000', result['outcome'].lower() or '10,000' in result['outcome'])
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
    
    def test_context_extraction(self):
        """Test context extraction from descriptions"""
        description = "I want to learn Spanish because I'm moving to Mexico next year so I can communicate better with locals"
        result = self.tool.run(description)
        
        self.assertIsInstance(result['context'], list)
        # Should extract motivation and reasoning
        context_text = ' '.join(result['context']).lower()
        self.assertTrue(any(word in context_text for word in ['mexico', 'communicate', 'locals']))


class TestTimeframeParsingTool(unittest.TestCase):
    """Test the Timeframe Parsing Tool"""
    
    def setUp(self):
        self.tool = TimeframeParsingTool()
    
    def test_specific_date_parsing(self):
        """Test parsing of specific dates"""
        description = "Complete project by December 15th, 2024"
        result = self.tool.run(description)
        
        self.assertIsNotNone(result['endDate'])
        self.assertIn('december', result['extractedPhrases'][0].lower() if result['extractedPhrases'] else '')
        self.assertGreater(result['confidence'], 0.5)
    
    def test_relative_date_parsing(self):
        """Test parsing of relative dates"""
        description = "Finish this in 3 weeks"
        result = self.tool.run(description)
        
        self.assertIsNotNone(result['duration'])
        self.assertEqual(result['duration']['days'], 21)  # 3 weeks = 21 days
        self.assertGreater(result['confidence'], 0.4)
    
    def test_milestone_extraction(self):
        """Test extraction of milestones"""
        description = "First complete the research phase, then write the draft, finally review and submit"
        result = self.tool.run(description)
        
        self.assertIsInstance(result['milestones'], list)
        self.assertGreater(len(result['milestones']), 0)
    
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
    
    def test_multiple_timeframes(self):
        """Test handling of multiple time references"""
        description = "Start next week, complete by end of month, with weekly checkpoints"
        result = self.tool.run(description)
        
        self.assertGreater(len(result['extractedPhrases']), 1)
        self.assertIsInstance(result['milestones'], list)


class TestMetricsIdentificationTool(unittest.TestCase):
    """Test the Metrics Identification Tool"""
    
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
    
    def test_implicit_metrics_learning(self):
        """Test identification of implicit learning metrics"""
        description = "Master JavaScript programming"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should suggest study time
        metric_names = [m['name'] for m in metrics]
        self.assertTrue(any('study' in name for name in metric_names))
    
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
    
    def test_habit_metrics(self):
        """Test identification of habit-related metrics"""
        description = "Meditate daily for better mental health"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should suggest consecutive days metric
        metric_names = [m['name'] for m in metrics]
        self.assertTrue(any('days' in name for name in metric_names))
    
    def test_confidence_scoring(self):
        """Test confidence scoring for metrics"""
        # High confidence with explicit metrics
        explicit_description = "Save $5000 and lose 20 pounds in 6 months"
        explicit_result = self.tool.run(explicit_description)
        
        # Low confidence with vague description
        vague_description = "Be better"
        vague_result = self.tool.run(vague_description)
        
        self.assertGreater(explicit_result['confidence'], vague_result['confidence'])
    
    def test_fallback_metrics(self):
        """Test fallback metrics for unmeasurable goals"""
        description = "Be happy"
        result = self.tool.run(description)
        
        metrics = result['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Should provide generic progress metric
        self.assertTrue(any('progress' in m['name'] or 'completion' in m['name'] for m in metrics))


class TestConstraintExtractionTool(unittest.TestCase):
    """Test the Constraint Extraction Tool"""
    
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
    
    def test_external_constraints(self):
        """Test extraction of external constraints"""
        description = "This depends on weather conditions and my boss's approval"
        result = self.tool.run(description)
        
        external_constraints = result['categories']['external_constraints']
        self.assertGreater(len(external_constraints), 0)
    
    def test_personal_constraints(self):
        """Test extraction of personal constraints"""
        description = "I'm worried about failing and have health issues that limit my mobility"
        result = self.tool.run(description)
        
        personal_constraints = result['categories']['personal_constraints']
        self.assertGreater(len(personal_constraints), 0)
    
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


class TestNLPAgent(unittest.TestCase):
    """Test the main NLP Agent"""
    
    def setUp(self):
        # Note: In real tests, you might want to mock the LlmAgent
        # to avoid actual API calls
        self.agent = NLPAgent()
    
    def test_comprehensive_goal_processing(self):
        """Test comprehensive processing of a complex goal"""
        description = """I want to train for and complete a marathon by October 2024. 
        I'm currently a beginner runner who can only run 2 miles. I have about 1 hour 
        per day to train, but I'm worried about getting injured. I need to lose 15 pounds 
        first and build up my endurance gradually."""
        
        result = self.agent.process_goal_description(description)
        
        # Check structure
        self.assertIn('original_description', result)
        self.assertIn('intent', result)
        self.assertIn('timeframe', result)
        self.assertIn('metrics', result)
        self.assertIn('constraints', result)
        self.assertIn('overall_confidence', result)
        self.assertIn('summary', result)
        self.assertIn('recommendations', result)
        
        # Check intent analysis
        intent = result['intent']
        self.assertEqual(intent['domain'], 'fitness')
        self.assertIn('marathon', intent['outcome'].lower())
        
        # Check timeframe analysis
        timeframe = result['timeframe']
        self.assertIsNotNone(timeframe.get('endDate') or timeframe.get('extractedPhrases'))
        
        # Check metrics analysis
        metrics = result['metrics']['metrics']
        self.assertGreater(len(metrics), 0)
        
        # Check constraints analysis
        constraints = result['constraints']['constraints']
        self.assertGreater(len(constraints), 0)
        
        # Check overall confidence
        self.assertIsInstance(result['overall_confidence'], float)
        self.assertGreaterEqual(result['overall_confidence'], 0.0)
        self.assertLessEqual(result['overall_confidence'], 1.0)
    
    def test_individual_tool_methods(self):
        """Test individual tool extraction methods"""
        description = "Learn Python in 3 months with $200 budget"
        
        # Test individual extractions
        intent = self.agent.extract_intent_only(description)
        timeframe = self.agent.extract_timeframe_only(description)
        metrics = self.agent.extract_metrics_only(description)
        constraints = self.agent.extract_constraints_only(description)
        
        self.assertIn('domain', intent)
        self.assertIn('confidence', timeframe)
        self.assertIn('metrics', metrics)
        self.assertIn('constraints', constraints)
    
    def test_simple_goal_processing(self):
        """Test processing of a simple goal"""
        description = "Read more books"
        result = self.agent.process_goal_description(description)
        
        # Should handle simple goals gracefully
        self.assertIsInstance(result, dict)
        self.assertIn('summary', result)
        self.assertIn('recommendations', result)
        
        # Should provide helpful recommendations for vague goals
        recommendations = result['recommendations']
        self.assertGreater(len(recommendations), 0)
    
    def test_error_handling(self):
        """Test error handling with invalid input"""
        # Test with empty string
        result = self.agent.process_goal_description("")
        self.assertIsInstance(result, dict)
        self.assertIn('overall_confidence', result)
        
        # Test with very long string
        long_description = "word " * 1000
        result = self.agent.process_goal_description(long_description)
        self.assertIsInstance(result, dict)
    
    def test_confidence_calculation(self):
        """Test overall confidence calculation"""
        # High confidence goal
        detailed_goal = """I will complete a certified Python programming course on Coursera 
        by December 31st, 2024. I will study for 2 hours every weekday evening and complete 
        all assignments. My goal is to get a job as a Python developer within 6 months after 
        completion. I have basic programming knowledge and a computer with internet access."""
        
        detailed_result = self.agent.process_goal_description(detailed_goal)
        
        # Low confidence goal
        vague_goal = "do something good"
        vague_result = self.agent.process_goal_description(vague_goal)
        
        self.assertGreater(detailed_result['overall_confidence'], vague_result['overall_confidence'])
    
    def test_summary_generation(self):
        """Test summary generation quality"""
        description = "Save $5000 for vacation by June 2024"
        result = self.agent.process_goal_description(description)
        
        summary = result['summary']
        self.assertIsInstance(summary, str)
        self.assertGreater(len(summary), 20)  # Should be substantial
        self.assertIn('finance', summary.lower())  # Should mention domain
    
    def test_recommendations_generation(self):
        """Test recommendations generation"""
        description = "Get better at stuff"  # Intentionally vague
        result = self.agent.process_goal_description(description)
        
        recommendations = result['recommendations']
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)
        
        # Should suggest making it more specific
        rec_text = ' '.join(recommendations).lower()
        self.assertTrue(any(word in rec_text for word in ['specific', 'details', 'measurable']))


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
        TestNLPAgent,
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
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print(f"{'='*50}")