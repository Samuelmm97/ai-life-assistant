"""
SMART Goal Tool for ADK agents
Provides utilities for creating and validating SMART goals
"""
from typing import Dict, Any, List
from google.adk.tools import BaseTool

class SMARTGoalTool(BaseTool):
    """Tool for SMART goal creation and validation"""
    
    def __init__(self):
        super().__init__(
            name="smart_goal_tool",
            description="Create and validate SMART goals with proper structure"
        )
    
    def run(self, goal_input: str) -> Dict[str, Any]:
        """
        Process goal input and return structured SMART goal template
        """
        return {
            "template": self._get_smart_template(),
            "validation_rules": self._get_validation_rules(),
            "examples": self._get_examples()
        }
    
    def validate_smart_criteria(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate a goal against SMART criteria
        """
        validation_results = {}
        
        # Check each SMART criterion
        validation_results['specific'] = self._validate_specific(goal_data)
        validation_results['measurable'] = self._validate_measurable(goal_data)
        validation_results['achievable'] = self._validate_achievable(goal_data)
        validation_results['relevant'] = self._validate_relevant(goal_data)
        validation_results['time_bound'] = self._validate_time_bound(goal_data)
        
        # Calculate overall score
        scores = [result['score'] for result in validation_results.values()]
        validation_results['overall_score'] = sum(scores) / len(scores)
        
        return validation_results
    
    def _get_smart_template(self) -> Dict[str, str]:
        """Return SMART goal template structure"""
        return {
            "title": "Clear, concise goal title",
            "description": "Detailed description of what you want to achieve",
            "specific": "What exactly will be accomplished? Be precise and clear.",
            "measurable": "How will progress be measured? What metrics will you use?",
            "achievable": "Is this goal realistic? What makes it attainable?",
            "relevant": "Why is this goal important? How does it align with your priorities?",
            "timeBound": "When will this be completed? What are the key deadlines?",
            "category": "Goal category (health, career, personal, financial, etc.)",
            "priority": "Priority level (high, medium, low)"
        }
    
    def _get_validation_rules(self) -> Dict[str, List[str]]:
        """Return validation rules for each SMART criterion"""
        return {
            "specific": [
                "Goal has a clear, well-defined objective",
                "Uses specific language rather than vague terms",
                "Answers what, who, where, when, why"
            ],
            "measurable": [
                "Includes quantifiable metrics or indicators",
                "Progress can be tracked objectively",
                "Success criteria are clearly defined"
            ],
            "achievable": [
                "Goal is realistic given available resources",
                "Takes into account constraints and limitations",
                "Builds on existing skills and capabilities"
            ],
            "relevant": [
                "Aligns with broader life goals and values",
                "Has clear benefits and importance",
                "Fits within current life context"
            ],
            "timeBound": [
                "Has a specific end date or deadline",
                "Includes intermediate milestones",
                "Creates urgency and accountability"
            ]
        }
    
    def _get_examples(self) -> Dict[str, Dict[str, str]]:
        """Return examples of good and bad SMART goals"""
        return {
            "good_example": {
                "title": "Complete Marathon Training",
                "specific": "Train for and complete a full 26.2-mile marathon",
                "measurable": "Run 4 times per week, increase weekly mileage by 10%",
                "achievable": "Currently run 5K regularly, have 6 months to train",
                "relevant": "Improve fitness and achieve personal challenge",
                "timeBound": "Complete marathon on October 15th, 2024"
            },
            "bad_example": {
                "title": "Get in shape",
                "specific": "Be healthier",
                "measurable": "Feel better",
                "achievable": "Exercise more",
                "relevant": "It's good for me",
                "timeBound": "Someday"
            }
        }
    
    def _validate_specific(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the Specific criterion"""
        specific_text = goal_data.get('specific', '')
        score = 0
        feedback = []
        
        if len(specific_text) > 20:
            score += 30
        if any(word in specific_text.lower() for word in ['what', 'who', 'where', 'when', 'why']):
            score += 20
        if not any(word in specific_text.lower() for word in ['maybe', 'probably', 'might']):
            score += 30
        if len(specific_text.split()) > 5:
            score += 20
        
        if score < 50:
            feedback.append("Make the goal more specific and detailed")
        if score < 70:
            feedback.append("Consider answering what, who, where, when, why")
        
        return {"score": min(score, 100), "feedback": feedback}
    
    def _validate_measurable(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the Measurable criterion"""
        measurable_text = goal_data.get('measurable', '')
        score = 0
        feedback = []
        
        # Check for numbers or quantifiable terms
        import re
        if re.search(r'\d+', measurable_text):
            score += 40
        if any(word in measurable_text.lower() for word in ['track', 'measure', 'count', 'percentage']):
            score += 30
        if len(measurable_text) > 15:
            score += 30
        
        if score < 50:
            feedback.append("Add specific metrics or numbers to track progress")
        if score < 70:
            feedback.append("Define how success will be measured")
        
        return {"score": min(score, 100), "feedback": feedback}
    
    def _validate_achievable(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the Achievable criterion"""
        achievable_text = goal_data.get('achievable', '')
        score = 0
        feedback = []
        
        if any(word in achievable_text.lower() for word in ['realistic', 'possible', 'can', 'able']):
            score += 30
        if any(word in achievable_text.lower() for word in ['resources', 'skills', 'experience']):
            score += 30
        if len(achievable_text) > 20:
            score += 40
        
        if score < 50:
            feedback.append("Explain why this goal is realistic and achievable")
        if score < 70:
            feedback.append("Consider available resources and constraints")
        
        return {"score": min(score, 100), "feedback": feedback}
    
    def _validate_relevant(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the Relevant criterion"""
        relevant_text = goal_data.get('relevant', '')
        score = 0
        feedback = []
        
        if any(word in relevant_text.lower() for word in ['important', 'priority', 'value', 'align']):
            score += 30
        if any(word in relevant_text.lower() for word in ['because', 'why', 'reason']):
            score += 30
        if len(relevant_text) > 20:
            score += 40
        
        if score < 50:
            feedback.append("Explain why this goal is important to you")
        if score < 70:
            feedback.append("Connect the goal to your broader priorities")
        
        return {"score": min(score, 100), "feedback": feedback}
    
    def _validate_time_bound(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the Time-bound criterion"""
        time_bound_text = goal_data.get('timeBound', '')
        score = 0
        feedback = []
        
        # Check for specific dates or timeframes
        import re
        if re.search(r'\d{4}|\d{1,2}/\d{1,2}|\d{1,2}-\d{1,2}', time_bound_text):
            score += 40
        if any(word in time_bound_text.lower() for word in ['by', 'deadline', 'complete', 'finish']):
            score += 30
        if any(word in time_bound_text.lower() for word in ['milestone', 'checkpoint', 'phase']):
            score += 30
        
        if score < 50:
            feedback.append("Set a specific deadline or target date")
        if score < 70:
            feedback.append("Consider adding intermediate milestones")
        
        return {"score": min(score, 100), "feedback": feedback}