"""
Goal Validation Tool for ADK agents
Provides comprehensive goal validation and improvement suggestions
"""
from typing import Dict, Any, List
from google.adk.tools import BaseTool
import re
from datetime import datetime, timedelta

class GoalValidationTool(BaseTool):
    """Tool for comprehensive goal validation and improvement"""
    
    def __init__(self):
        super().__init__(
            name="goal_validation_tool",
            description="Validate goals and provide improvement suggestions"
        )
    
    def run(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive goal validation
        """
        validation_results = {
            "is_valid": True,
            "validation_score": 0,
            "issues": [],
            "suggestions": [],
            "strengths": []
        }
        
        # Run all validation checks
        validation_results.update(self._validate_completeness(goal_data))
        validation_results.update(self._validate_smart_criteria(goal_data))
        validation_results.update(self._validate_timeline(goal_data))
        validation_results.update(self._validate_milestones(goal_data))
        
        # Calculate overall validation score
        validation_results["validation_score"] = self._calculate_overall_score(validation_results)
        validation_results["is_valid"] = validation_results["validation_score"] >= 70
        
        return validation_results
    
    def suggest_improvements(self, goal_data: Dict[str, Any]) -> List[str]:
        """
        Generate specific improvement suggestions for a goal
        """
        suggestions = []
        
        # Check title
        title = goal_data.get('title', '')
        if len(title) < 5:
            suggestions.append("Create a more descriptive title (at least 5 characters)")
        elif len(title) > 100:
            suggestions.append("Shorten the title to be more concise (under 100 characters)")
        
        # Check description
        description = goal_data.get('description', '')
        if len(description) < 20:
            suggestions.append("Add more detail to the description (at least 20 characters)")
        
        # Check SMART criteria
        smart_suggestions = self._get_smart_suggestions(goal_data)
        suggestions.extend(smart_suggestions)
        
        # Check milestones
        milestones = goal_data.get('milestones', [])
        if len(milestones) == 0:
            suggestions.append("Add milestones to break down the goal into manageable steps")
        elif len(milestones) > 10:
            suggestions.append("Consider reducing the number of milestones to focus on key checkpoints")
        
        # Check timeline
        timeline_suggestions = self._get_timeline_suggestions(goal_data)
        suggestions.extend(timeline_suggestions)
        
        return suggestions
    
    def _validate_completeness(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check if all required fields are present and complete"""
        required_fields = ['title', 'description', 'specific', 'measurable', 'achievable', 'relevant', 'timeBound']
        issues = []
        strengths = []
        
        for field in required_fields:
            value = goal_data.get(field, '')
            if not value or len(str(value).strip()) < 3:
                issues.append(f"Missing or incomplete {field}")
            else:
                strengths.append(f"Complete {field} provided")
        
        return {"completeness_issues": issues, "completeness_strengths": strengths}
    
    def _validate_smart_criteria(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate SMART criteria quality"""
        issues = []
        strengths = []
        
        # Specific validation
        specific = goal_data.get('specific', '')
        if len(specific) < 10:
            issues.append("Specific criterion needs more detail")
        elif any(word in specific.lower() for word in ['exactly', 'precisely', 'specifically']):
            strengths.append("Specific criterion is well-defined")
        
        # Measurable validation
        measurable = goal_data.get('measurable', '')
        if not re.search(r'\d+|percent|%|measure|track|count', measurable.lower()):
            issues.append("Measurable criterion lacks quantifiable metrics")
        else:
            strengths.append("Measurable criterion includes metrics")
        
        # Achievable validation
        achievable = goal_data.get('achievable', '')
        if len(achievable) < 15:
            issues.append("Achievable criterion needs more justification")
        elif any(word in achievable.lower() for word in ['realistic', 'possible', 'feasible']):
            strengths.append("Achievable criterion is well-justified")
        
        # Relevant validation
        relevant = goal_data.get('relevant', '')
        if len(relevant) < 15:
            issues.append("Relevant criterion needs more explanation")
        elif any(word in relevant.lower() for word in ['important', 'priority', 'align', 'value']):
            strengths.append("Relevant criterion shows clear importance")
        
        # Time-bound validation
        time_bound = goal_data.get('timeBound', '')
        if not re.search(r'\d{4}|\d{1,2}/\d{1,2}|\d{1,2}-\d{1,2}|week|month|year', time_bound.lower()):
            issues.append("Time-bound criterion lacks specific dates or timeframes")
        else:
            strengths.append("Time-bound criterion includes specific timeline")
        
        return {"smart_issues": issues, "smart_strengths": strengths}
    
    def _validate_timeline(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate goal timeline and deadlines"""
        issues = []
        strengths = []
        
        time_bound = goal_data.get('timeBound', '')
        
        # Check for unrealistic timelines
        if any(word in time_bound.lower() for word in ['tomorrow', 'next week', 'few days']):
            issues.append("Timeline may be too aggressive")
        elif any(word in time_bound.lower() for word in ['someday', 'eventually', 'one day']):
            issues.append("Timeline is too vague")
        else:
            strengths.append("Timeline appears realistic")
        
        # Check milestones alignment
        milestones = goal_data.get('milestones', [])
        if len(milestones) > 0:
            # Basic milestone validation
            for i, milestone in enumerate(milestones):
                if not milestone.get('dueDate'):
                    issues.append(f"Milestone {i+1} missing due date")
        
        return {"timeline_issues": issues, "timeline_strengths": strengths}
    
    def _validate_milestones(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate goal milestones"""
        issues = []
        strengths = []
        
        milestones = goal_data.get('milestones', [])
        
        if len(milestones) == 0:
            issues.append("No milestones defined to track progress")
        else:
            strengths.append(f"{len(milestones)} milestones defined")
            
            # Validate each milestone
            for i, milestone in enumerate(milestones):
                if not milestone.get('title'):
                    issues.append(f"Milestone {i+1} missing title")
                if not milestone.get('description'):
                    issues.append(f"Milestone {i+1} missing description")
        
        return {"milestone_issues": issues, "milestone_strengths": strengths}
    
    def _get_smart_suggestions(self, goal_data: Dict[str, Any]) -> List[str]:
        """Generate SMART-specific improvement suggestions"""
        suggestions = []
        
        # Specific suggestions
        specific = goal_data.get('specific', '')
        if 'what' not in specific.lower():
            suggestions.append("In the Specific section, clearly state what you want to accomplish")
        
        # Measurable suggestions
        measurable = goal_data.get('measurable', '')
        if not re.search(r'\d+', measurable):
            suggestions.append("Add specific numbers or percentages to make the goal measurable")
        
        # Achievable suggestions
        achievable = goal_data.get('achievable', '')
        if 'resource' not in achievable.lower():
            suggestions.append("Consider what resources you'll need to achieve this goal")
        
        # Relevant suggestions
        relevant = goal_data.get('relevant', '')
        if 'why' not in relevant.lower():
            suggestions.append("Explain why this goal is important to you in the Relevant section")
        
        # Time-bound suggestions
        time_bound = goal_data.get('timeBound', '')
        if 'by' not in time_bound.lower() and 'deadline' not in time_bound.lower():
            suggestions.append("Set a clear deadline using 'by [date]' in the Time-bound section")
        
        return suggestions
    
    def _get_timeline_suggestions(self, goal_data: Dict[str, Any]) -> List[str]:
        """Generate timeline-specific suggestions"""
        suggestions = []
        
        milestones = goal_data.get('milestones', [])
        time_bound = goal_data.get('timeBound', '')
        
        # Suggest milestone timing
        if len(milestones) == 0:
            suggestions.append("Break down your goal into 3-5 milestones with specific dates")
        elif len(milestones) == 1:
            suggestions.append("Add more milestones to better track progress")
        
        # Check for buffer time
        if 'buffer' not in time_bound.lower() and 'extra' not in time_bound.lower():
            suggestions.append("Consider adding buffer time for unexpected delays")
        
        return suggestions
    
    def _calculate_overall_score(self, validation_results: Dict[str, Any]) -> int:
        """Calculate overall validation score (0-100)"""
        score = 100
        
        # Deduct points for issues
        completeness_issues = len(validation_results.get("completeness_issues", []))
        smart_issues = len(validation_results.get("smart_issues", []))
        timeline_issues = len(validation_results.get("timeline_issues", []))
        milestone_issues = len(validation_results.get("milestone_issues", []))
        
        # Scoring weights
        score -= completeness_issues * 15  # Major deduction for missing fields
        score -= smart_issues * 10         # Moderate deduction for SMART issues
        score -= timeline_issues * 8       # Moderate deduction for timeline issues
        score -= milestone_issues * 5      # Minor deduction for milestone issues
        
        return max(0, score)  # Ensure score doesn't go below 0