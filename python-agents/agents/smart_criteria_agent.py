"""
SMART Criteria Agent using Google ADK
Generates specific SMART criteria suggestions for goals
"""
import json
from typing import Dict, Any, List
from google.adk.agents import LlmAgent
from .base_agent import BaseLifeAssistantAgent

class SMARTCriteriaAgent(BaseLifeAssistantAgent):
    def __init__(self):
        agent_description = "Generates specific SMART criteria suggestions and milestone recommendations for goals"
        system_prompt = """
You are an expert SMART criteria generator that helps users create specific, actionable criteria for their goals.

Your task is to generate detailed SMART criteria suggestions based on goal titles and descriptions.

Always respond with a JSON object containing:
{
    "specific": {
        "suggestions": ["Specific suggestion 1", "Specific suggestion 2"],
        "questions": ["What exactly do you want to accomplish?", "Who is involved?"],
        "examples": ["Example specific statement 1", "Example specific statement 2"]
    },
    "measurable": {
        "suggestions": ["Measurable suggestion 1", "Measurable suggestion 2"],
        "questions": ["How will you measure progress?", "What metrics will you use?"],
        "examples": ["Example metric 1", "Example metric 2"],
        "metrics": [
            {
                "name": "Metric name",
                "unit": "Unit of measurement",
                "target": "Target value",
                "frequency": "How often to measure"
            }
        ]
    },
    "achievable": {
        "suggestions": ["Achievable suggestion 1", "Achievable suggestion 2"],
        "questions": ["Is this goal realistic?", "What resources do you need?"],
        "considerations": ["Consideration 1", "Consideration 2"],
        "resources": ["Resource 1", "Resource 2"]
    },
    "relevant": {
        "suggestions": ["Relevant suggestion 1", "Relevant suggestion 2"],
        "questions": ["Why is this goal important?", "How does it align with your priorities?"],
        "alignmentAreas": ["Career", "Health", "Personal Development"],
        "benefits": ["Benefit 1", "Benefit 2"]
    },
    "timeBound": {
        "suggestions": ["Time-bound suggestion 1", "Time-bound suggestion 2"],
        "questions": ["When will you complete this?", "What are your milestones?"],
        "timeframes": ["Short-term (1-3 months)", "Medium-term (3-12 months)"],
        "milestones": [
            {
                "title": "Milestone title",
                "timeframe": "When to complete",
                "description": "What to accomplish"
            }
        ]
    }
}
"""
        
        super().__init__(
            agent_name="SMARTCriteriaAgent",
            agent_description=agent_description,
            system_prompt=system_prompt
        )
    
    async def run_async(self, goal_input: Dict[str, str]) -> Dict[str, Any]:
        """
        Generate SMART criteria suggestions for a goal (async)
        """
        try:
            title = goal_input.get('title', '')
            description = goal_input.get('description', '')
            
            criteria_prompt = f"""
            Generate comprehensive SMART criteria suggestions for this goal:
            
            Title: {title}
            Description: {description}
            
            Provide specific, actionable suggestions for each SMART criterion.
            """
            
            # Use proper ADK async runner pattern
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=criteria_prompt,
                user_id="smart_criteria_user",
                session_id=f"criteria_{hash(title + description)}"
            )
            
            if isinstance(response, str):
                try:
                    criteria = json.loads(response)
                except json.JSONDecodeError:
                    criteria = self._parse_text_response(response)
            else:
                criteria = response
            
            validated_criteria = self._validate_criteria_structure(criteria)
            
            return {
                'success': True,
                'criteria': validated_criteria,
                'agent_name': self.agent_name
            }
            
        except Exception as e:
            fallback_criteria = self._create_fallback_criteria(goal_input, str(e))
            return {
                'success': False,
                'criteria': fallback_criteria,
                'agent_name': self.agent_name,
                'error': str(e)
            }
    
    def run(self, goal_input: Dict[str, str]) -> Dict[str, Any]:
        """
        Generate SMART criteria suggestions for a goal (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(goal_input))
        finally:
            loop.close()
    
    async def generate_milestone_suggestions_async(self, goal_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate milestone suggestions for a goal (async)
        """
        try:
            milestone_prompt = f"""
            Generate milestone suggestions for this goal:
            
            Goal: {json.dumps(goal_data, indent=2)}
            
            Create 3-5 logical milestones that break down the goal into manageable steps.
            Each milestone should have a title, description, and suggested timeframe.
            """
            
            # Use proper ADK async runner pattern
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=milestone_prompt,
                user_id="milestone_user",
                session_id=f"milestones_{hash(str(goal_data))}"
            )
            
            if isinstance(response, str):
                try:
                    milestones = json.loads(response)
                except json.JSONDecodeError:
                    milestones = {'milestones': []}
            else:
                milestones = response
            
            # Ensure it's a list
            if isinstance(milestones, dict) and 'milestones' in milestones:
                return milestones['milestones']
            elif isinstance(milestones, list):
                return milestones
            else:
                return []
                
        except Exception as e:
            return self._create_fallback_milestones(goal_data)
    
    def generate_milestone_suggestions(self, goal_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate milestone suggestions for a goal (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.generate_milestone_suggestions_async(goal_data))
        finally:
            loop.close()
    
    def _validate_criteria_structure(self, criteria: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure criteria has all required fields with proper defaults
        """
        smart_criteria = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
        
        for criterion in smart_criteria:
            if criterion not in criteria:
                criteria[criterion] = {}
            
            # Ensure basic structure for each criterion
            if 'suggestions' not in criteria[criterion]:
                criteria[criterion]['suggestions'] = []
            if 'questions' not in criteria[criterion]:
                criteria[criterion]['questions'] = []
        
        # Add specific structures for certain criteria
        if 'examples' not in criteria.get('specific', {}):
            criteria['specific']['examples'] = []
        
        if 'metrics' not in criteria.get('measurable', {}):
            criteria['measurable']['metrics'] = []
        
        if 'considerations' not in criteria.get('achievable', {}):
            criteria['achievable']['considerations'] = []
        if 'resources' not in criteria.get('achievable', {}):
            criteria['achievable']['resources'] = []
        
        if 'alignmentAreas' not in criteria.get('relevant', {}):
            criteria['relevant']['alignmentAreas'] = []
        if 'benefits' not in criteria.get('relevant', {}):
            criteria['relevant']['benefits'] = []
        
        if 'timeframes' not in criteria.get('timeBound', {}):
            criteria['timeBound']['timeframes'] = []
        if 'milestones' not in criteria.get('timeBound', {}):
            criteria['timeBound']['milestones'] = []
        
        return criteria
    
    def _create_fallback_criteria(self, goal_input: Dict[str, str], error: str) -> Dict[str, Any]:
        """
        Create basic criteria when agent fails
        """
        title = goal_input.get('title', 'Goal')
        
        return {
            'specific': {
                'suggestions': [f'Define exactly what you want to achieve with "{title}"'],
                'questions': ['What exactly do you want to accomplish?'],
                'examples': []
            },
            'measurable': {
                'suggestions': [f'Identify how you will measure progress on "{title}"'],
                'questions': ['How will you measure progress?'],
                'examples': [],
                'metrics': []
            },
            'achievable': {
                'suggestions': [f'Ensure "{title}" is realistic given your resources'],
                'questions': ['Is this goal realistic?'],
                'considerations': [],
                'resources': []
            },
            'relevant': {
                'suggestions': [f'Confirm "{title}" aligns with your priorities'],
                'questions': ['Why is this goal important?'],
                'alignmentAreas': [],
                'benefits': []
            },
            'timeBound': {
                'suggestions': [f'Set a clear deadline for "{title}"'],
                'questions': ['When will you complete this?'],
                'timeframes': [],
                'milestones': []
            },
            'agent_error': error
        }
    
    def _parse_text_response(self, response: str) -> Dict[str, Any]:
        """
        Parse text response into structured criteria when JSON parsing fails
        """
        return {
            'specific': {
                'suggestions': ['Generated from text response'],
                'questions': ['What exactly do you want to accomplish?'],
                'examples': []
            },
            'measurable': {
                'suggestions': ['Generated from text response'],
                'questions': ['How will you measure progress?'],
                'examples': [],
                'metrics': []
            },
            'achievable': {
                'suggestions': ['Generated from text response'],
                'questions': ['Is this goal realistic?'],
                'considerations': [],
                'resources': []
            },
            'relevant': {
                'suggestions': ['Generated from text response'],
                'questions': ['Why is this goal important?'],
                'alignmentAreas': [],
                'benefits': []
            },
            'timeBound': {
                'suggestions': ['Generated from text response'],
                'questions': ['When will you complete this?'],
                'timeframes': [],
                'milestones': []
            },
            'text_response': response
        }
    
    def _create_fallback_milestones(self, goal_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Create basic milestones when agent fails
        """
        title = goal_data.get('title', 'Goal')
        
        return [
            {
                'title': f'Start {title}',
                'description': 'Begin working on the goal',
                'timeframe': 'Week 1'
            },
            {
                'title': f'Mid-point check for {title}',
                'description': 'Evaluate progress and adjust if needed',
                'timeframe': 'Mid-point'
            },
            {
                'title': f'Complete {title}',
                'description': 'Achieve the final goal',
                'timeframe': 'End date'
            }
        ]
    
    def get_capabilities(self) -> List[str]:
        """Return agent capabilities"""
        return [
            "smart_criteria_generation",
            "milestone_suggestions",
            "goal_questions_generation",
            "metric_recommendations",
            "resource_identification",
            "timeline_planning",
            "criteria_validation"
        ]