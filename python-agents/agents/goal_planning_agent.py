"""
Goal Planning Agent using Google ADK
Transforms natural language input into structured SMART goals
"""
import json
from typing import Dict, Any, List
from google.adk.agents import Agent
from .base_agent import BaseLifeAssistantAgent
from .tools.smart_goal_tool import SMARTGoalTool
from .tools.goal_validation_tool import GoalValidationTool

class GoalPlanningAgent(BaseLifeAssistantAgent):
    def __init__(self):
        agent_description = "Transforms natural language input into structured SMART goals with detailed planning"
        system_prompt = """
You are an expert goal planning assistant that helps users create SMART goals.

SMART criteria:
- Specific: Clear and well-defined
- Measurable: Quantifiable progress indicators
- Achievable: Realistic and attainable
- Relevant: Aligned with user's values and priorities
- Time-bound: Has clear deadlines and milestones

Your task is to transform natural language goal descriptions into structured SMART goals.

Always respond with a JSON object containing:
{
    "title": "Clear, concise goal title",
    "description": "Detailed goal description",
    "specific": "What exactly will be accomplished",
    "measurable": "How progress will be measured",
    "achievable": "Why this goal is realistic",
    "relevant": "How this goal aligns with user's priorities",
    "timeBound": "Specific timeline and deadlines",
    "category": "Goal category (health, career, personal, etc.)",
    "priority": "high|medium|low",
    "milestones": [
        {
            "title": "Milestone title",
            "description": "Milestone description",
            "dueDate": "YYYY-MM-DD",
            "completed": false
        }
    ],
    "successCriteria": ["Criterion 1", "Criterion 2"],
    "potentialObstacles": ["Obstacle 1", "Obstacle 2"],
    "resources": ["Resource 1", "Resource 2"]
}
"""
        
        # Initialize base agent with tools
        super().__init__(
            agent_name="GoalPlanningAgent",
            agent_description=agent_description,
            system_prompt=system_prompt,
            tools=[
                SMARTGoalTool(),
                GoalValidationTool()
            ]
        )
    
    async def run_async(self, user_input: str) -> Dict[str, Any]:
        """
        Process natural language input and return structured SMART goal (async)
        """
        try:
            if not self.validate_input(user_input):
                return self.handle_error(ValueError("Invalid input"), user_input)
            
            # Execute the ADK agent using proper async runner pattern
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=user_input,
                user_id="goal_planning_user",
                session_id=f"goal_session_{self.agent_id}"
            )
            
            print(f"ADK Agent Response: {response}")
            
            # Parse JSON response
            if isinstance(response, str):
                try:
                    goal_data = json.loads(response)
                except json.JSONDecodeError:
                    # If response is not JSON, create structured goal from text
                    goal_data = self._parse_text_response(response, user_input)
            else:
                goal_data = response
            
            # Validate and enhance the goal
            validated_goal = self._validate_goal_structure(goal_data)
            
            return {
                'success': True,
                'goal': validated_goal,
                'agent_name': self.agent_name
            }
            
        except Exception as e:
            # Fallback to basic goal structure
            fallback_goal = self._create_fallback_goal(user_input, str(e))
            return {
                'success': False,
                'goal': fallback_goal,
                'agent_name': self.agent_name,
                'error': str(e)
            }
    
    def run(self, user_input: str) -> Dict[str, Any]:
        """
        Process natural language input and return structured SMART goal (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(user_input))
        finally:
            loop.close()
    
    async def refine_async(self, goal_data: Dict[str, Any], feedback: str) -> Dict[str, Any]:
        """
        Refine an existing goal based on feedback (async)
        """
        refinement_prompt = f"""
        Please refine this existing goal based on the provided feedback:
        
        Current Goal: {json.dumps(goal_data, indent=2)}
        
        Feedback: {feedback}
        
        Improve the goal while maintaining SMART criteria compliance.
        """
        
        try:
            response = await self.adk_config.execute_agent_async(
                agent=self.adk_agent,
                user_input=refinement_prompt,
                user_id="goal_planning_user",
                session_id=f"refine_session_{self.agent_id}"
            )
            
            if isinstance(response, str):
                try:
                    refined_goal = json.loads(response)
                except json.JSONDecodeError:
                    refined_goal = self._parse_text_response(response, str(goal_data))
            else:
                refined_goal = response
            
            return self._validate_goal_structure(refined_goal)
            
        except Exception as e:
            # Return original goal with error note
            goal_data['refinement_error'] = str(e)
            return goal_data
    
    def refine(self, goal_data: Dict[str, Any], feedback: str) -> Dict[str, Any]:
        """
        Refine an existing goal based on feedback (sync wrapper)
        """
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.refine_async(goal_data, feedback))
        finally:
            loop.close()
    
    def _validate_goal_structure(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure goal has all required fields with proper defaults
        """
        required_fields = {
            'title': 'Untitled Goal',
            'description': '',
            'specific': '',
            'measurable': '',
            'achievable': '',
            'relevant': '',
            'timeBound': '',
            'category': 'personal',
            'priority': 'medium',
            'milestones': [],
            'successCriteria': [],
            'potentialObstacles': [],
            'resources': []
        }
        
        # Ensure all required fields exist
        for field, default_value in required_fields.items():
            if field not in goal_data:
                goal_data[field] = default_value
        
        # Add metadata
        goal_data['id'] = self._generate_goal_id()
        goal_data['status'] = 'not_started'
        goal_data['progress'] = 0
        goal_data['createdAt'] = self._get_current_timestamp()
        goal_data['updatedAt'] = self._get_current_timestamp()
        
        return goal_data
    
    def _parse_text_response(self, response: str, user_input: str) -> Dict[str, Any]:
        """
        Parse text response into structured goal when JSON parsing fails
        """
        # Extract title from first line or user input
        lines = response.split('\n')
        title = lines[0].strip() if lines else user_input[:50]
        
        # Basic goal structure from text response
        return {
            'title': title,
            'description': response,
            'specific': 'Generated from text response',
            'measurable': 'Needs specific metrics',
            'achievable': 'Appears realistic',
            'relevant': 'Based on user input',
            'timeBound': 'Timeline needs clarification',
            'category': 'personal',
            'priority': 'medium',
            'milestones': [],
            'successCriteria': [],
            'potentialObstacles': [],
            'resources': []
        }
    
    def _create_fallback_goal(self, user_input: str, error: str) -> Dict[str, Any]:
        """
        Create a basic goal structure when agent fails
        """
        return {
            'id': self._generate_goal_id(),
            'title': user_input[:50] + ('...' if len(user_input) > 50 else ''),
            'description': user_input,
            'specific': 'Needs refinement',
            'measurable': 'Needs refinement',
            'achievable': 'Needs refinement',
            'relevant': 'Needs refinement',
            'timeBound': 'Needs refinement',
            'category': 'personal',
            'priority': 'medium',
            'status': 'not_started',
            'progress': 0,
            'milestones': [],
            'successCriteria': [],
            'potentialObstacles': [],
            'resources': [],
            'createdAt': self._get_current_timestamp(),
            'updatedAt': self._get_current_timestamp(),
            'agent_error': error
        }
    
    def _generate_goal_id(self) -> str:
        """Generate unique goal ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_capabilities(self) -> List[str]:
        """Return agent capabilities"""
        return [
            "natural_language_goal_creation",
            "smart_goal_validation",
            "goal_structure_generation",
            "milestone_creation",
            "goal_refinement",
            "action_plan_generation"
        ]