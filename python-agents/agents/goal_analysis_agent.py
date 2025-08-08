"""
Goal Analysis Agent using Google ADK
Analyzes existing goals for SMART criteria compliance and provides improvement suggestions
"""
import json
from typing import Dict, Any, List
from google.adk.agents import LlmAgent
from .base_agent import BaseLifeAssistantAgent

class GoalAnalysisAgent(BaseLifeAssistantAgent):
    def __init__(self):
        agent_description = "Analyzes existing goals for SMART criteria compliance and provides improvement suggestions"
        system_prompt = """
You are an expert goal analysis assistant that evaluates goals against SMART criteria.

Your task is to analyze existing goals and provide detailed feedback on their compliance with SMART criteria:
- Specific: Is the goal clear and well-defined?
- Measurable: Can progress be quantified?
- Achievable: Is the goal realistic and attainable?
- Relevant: Does it align with user's priorities?
- Time-bound: Are there clear deadlines?

Always respond with a JSON object containing:
{
    "overallScore": 85,
    "smartAnalysis": {
        "specific": {
            "score": 90,
            "feedback": "Goal is clearly defined",
            "suggestions": ["Suggestion 1", "Suggestion 2"]
        },
        "measurable": {
            "score": 80,
            "feedback": "Progress indicators are present",
            "suggestions": ["Add specific metrics"]
        },
        "achievable": {
            "score": 85,
            "feedback": "Goal appears realistic",
            "suggestions": ["Consider potential constraints"]
        },
        "relevant": {
            "score": 90,
            "feedback": "Well-aligned with priorities",
            "suggestions": ["Ensure long-term relevance"]
        },
        "timeBound": {
            "score": 75,
            "feedback": "Timeline is present but could be more specific",
            "suggestions": ["Add intermediate deadlines"]
        }
    },
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "riskFactors": ["Risk 1", "Risk 2"],
    "successProbability": 75
}
"""
        
        super().__init__(
            agent_name="GoalAnalysisAgent",
            agent_description=agent_description,
            system_prompt=system_prompt
        )
    
    async def run_async(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a goal and return detailed SMART criteria evaluation (async)
        """
        try:
            # Prepare goal data for analysis
            analysis_prompt = f"""
            Please analyze this goal for SMART criteria compliance:
            
            Goal Data: {json.dumps(goal_data, indent=2)}
            
            Provide detailed analysis with scores (0-100) for each SMART criterion.
            """
            
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=analysis_prompt,
                user_id="goal_analysis_user",
                session_id=f"analysis_session_{self.agent_id}"
            )
            
            if isinstance(response, str):
                try:
                    analysis = json.loads(response)
                except json.JSONDecodeError:
                    # Create basic analysis from text response
                    analysis = self._parse_text_analysis(response)
            else:
                analysis = response
            
            # Validate and enhance analysis
            validated_analysis = self._validate_analysis_structure(analysis)
            
            return {
                'success': True,
                'analysis': validated_analysis,
                'agent_name': self.agent_name
            }
            
        except Exception as e:
            fallback_analysis = self._create_fallback_analysis(goal_data, str(e))
            return {
                'success': False,
                'analysis': fallback_analysis,
                'agent_name': self.agent_name,
                'error': str(e)
            }
    
    def run(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a goal and return detailed SMART criteria evaluation (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(goal_data))
        finally:
            loop.close()
    
    async def analyze_multiple_goals_async(self, goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze multiple goals and provide comparative insights (async)
        """
        try:
            analysis_prompt = f"""
            Please analyze these multiple goals and provide comparative insights:
            
            Goals: {json.dumps(goals, indent=2)}
            
            Provide individual analysis for each goal plus overall insights about:
            - Goal portfolio balance
            - Resource allocation concerns
            - Timeline conflicts
            - Priority alignment
            """
            
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=analysis_prompt,
                user_id="goal_analysis_user",
                session_id=f"multi_analysis_session_{self.agent_id}"
            )
            
            if isinstance(response, str):
                try:
                    analysis = json.loads(response)
                except json.JSONDecodeError:
                    analysis = {'text_response': response, 'individual_analyses': []}
            else:
                analysis = response
            
            return analysis
            
        except Exception as e:
            # Run individual analyses asynchronously
            individual_analyses = []
            for goal in goals:
                try:
                    result = await self.run_async(goal)
                    individual_analyses.append(result)
                except Exception as goal_error:
                    individual_analyses.append({'error': str(goal_error), 'goal': goal})
            
            return {
                'error': str(e),
                'individual_analyses': individual_analyses
            }
    
    def analyze_multiple_goals(self, goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze multiple goals and provide comparative insights (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.analyze_multiple_goals_async(goals))
        finally:
            loop.close()
    
    def _validate_analysis_structure(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure analysis has all required fields with proper defaults
        """
        # Default structure
        default_criterion = {
            'score': 50,
            'feedback': 'Analysis needed',
            'suggestions': []
        }
        
        # Ensure main structure exists
        if 'overallScore' not in analysis:
            analysis['overallScore'] = 50
        
        if 'smartAnalysis' not in analysis:
            analysis['smartAnalysis'] = {}
        
        # Ensure all SMART criteria are present
        smart_criteria = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
        for criterion in smart_criteria:
            if criterion not in analysis['smartAnalysis']:
                analysis['smartAnalysis'][criterion] = default_criterion.copy()
        
        # Ensure other required fields
        required_fields = {
            'strengths': [],
            'weaknesses': [],
            'recommendations': [],
            'riskFactors': [],
            'successProbability': 50
        }
        
        for field, default_value in required_fields.items():
            if field not in analysis:
                analysis[field] = default_value
        
        # Calculate overall score if not provided
        if analysis['overallScore'] == 50:  # Default value, recalculate
            scores = [analysis['smartAnalysis'][criterion]['score'] 
                     for criterion in smart_criteria]
            analysis['overallScore'] = sum(scores) // len(scores)
        
        return analysis
    
    def _parse_text_analysis(self, response: str) -> Dict[str, Any]:
        """
        Parse text response into structured analysis when JSON parsing fails
        """
        return {
            'overallScore': 60,
            'smartAnalysis': {
                'specific': {
                    'score': 60,
                    'feedback': 'Analysis from text response',
                    'suggestions': ['Review text analysis for details']
                },
                'measurable': {
                    'score': 60,
                    'feedback': 'Analysis from text response',
                    'suggestions': ['Review text analysis for details']
                },
                'achievable': {
                    'score': 60,
                    'feedback': 'Analysis from text response',
                    'suggestions': ['Review text analysis for details']
                },
                'relevant': {
                    'score': 60,
                    'feedback': 'Analysis from text response',
                    'suggestions': ['Review text analysis for details']
                },
                'timeBound': {
                    'score': 60,
                    'feedback': 'Analysis from text response',
                    'suggestions': ['Review text analysis for details']
                }
            },
            'strengths': ['Generated from agent response'],
            'weaknesses': ['JSON parsing failed'],
            'recommendations': ['Review full text response'],
            'riskFactors': ['Response format inconsistency'],
            'successProbability': 60,
            'text_response': response
        }
    
    def _create_fallback_analysis(self, goal_data: Dict[str, Any], error: str) -> Dict[str, Any]:
        """
        Create basic analysis when agent fails
        """
        return {
            'overallScore': 50,
            'smartAnalysis': {
                'specific': {
                    'score': 50,
                    'feedback': 'Unable to analyze - agent error',
                    'suggestions': ['Manual review needed']
                },
                'measurable': {
                    'score': 50,
                    'feedback': 'Unable to analyze - agent error',
                    'suggestions': ['Manual review needed']
                },
                'achievable': {
                    'score': 50,
                    'feedback': 'Unable to analyze - agent error',
                    'suggestions': ['Manual review needed']
                },
                'relevant': {
                    'score': 50,
                    'feedback': 'Unable to analyze - agent error',
                    'suggestions': ['Manual review needed']
                },
                'timeBound': {
                    'score': 50,
                    'feedback': 'Unable to analyze - agent error',
                    'suggestions': ['Manual review needed']
                }
            },
            'strengths': [],
            'weaknesses': ['Analysis failed due to technical error'],
            'recommendations': ['Retry analysis or perform manual review'],
            'riskFactors': ['Technical analysis unavailable'],
            'successProbability': 50,
            'agent_error': error
        }
    
    def get_capabilities(self) -> List[str]:
        """Return agent capabilities"""
        return [
            "smart_criteria_analysis",
            "goal_scoring",
            "weakness_identification",
            "strength_identification", 
            "improvement_recommendations",
            "risk_assessment",
            "success_probability_estimation",
            "multi_goal_analysis"
        ]