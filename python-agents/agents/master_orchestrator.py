"""
Master Orchestrator Agent for AI Life Assistant
Coordinates all domain agents and workflows using ADK patterns
"""
import json
import time
from typing import Dict, Any, List, Optional
from google.adk.agents import SequentialAgent, ParallelAgent, LoopAgent
from .base_agent import BaseLifeAssistantAgent, WorkflowAgent
from .goal_planning_agent import GoalPlanningAgent
from .goal_analysis_agent import GoalAnalysisAgent
from .smart_criteria_agent import SMARTCriteriaAgent

class MasterOrchestratorAgent(WorkflowAgent):
    """Master orchestrator that coordinates all life assistant agents"""
    
    def __init__(self):
        system_prompt = """
You are the Master Orchestrator for the AI Life Assistant platform.

Your responsibilities:
1. Route user requests to appropriate domain agents
2. Coordinate multi-agent workflows for complex tasks
3. Manage agent communication and data transfer
4. Ensure consistent user experience across all domains
5. Handle error recovery and fallback scenarios

You coordinate these agent types:
- SMART Goal Planning Agent: Creates structured goals from natural language
- Goal Analysis Agent: Evaluates goals for SMART criteria compliance
- SMART Criteria Agent: Generates specific criteria suggestions
- Domain Agents: Fitness, Nutrition, Finance, Learning, etc. (to be added)
- Scheduler Agent: Manages calendar integration and time blocking
- Analytics Agent: Tracks progress and generates insights

Use ADK workflow patterns:
- Sequential: For step-by-step processes (goal creation → validation → planning)
- Parallel: For independent operations (multi-domain analysis)
- Loop: For iterative refinement (goal improvement cycles)

Always maintain context between agent interactions and provide clear status updates.
"""
        
        super().__init__(
            workflow_type="orchestrator",
            agent_name="MasterOrchestrator",
            system_prompt=system_prompt
        )
        
        # Initialize core agents
        self.goal_planning_agent = GoalPlanningAgent()
        self.goal_analysis_agent = GoalAnalysisAgent()
        self.smart_criteria_agent = SMARTCriteriaAgent()
        
        # Agent registry for dynamic routing
        self.agent_registry = {
            'goal_planning': self.goal_planning_agent,
            'goal_analysis': self.goal_analysis_agent,
            'smart_criteria': self.smart_criteria_agent
        }
        
        # Workflow templates
        self.workflow_templates = {
            'goal_creation': self._create_goal_creation_workflow,
            'goal_analysis': self._create_goal_analysis_workflow,
            'goal_refinement': self._create_goal_refinement_workflow
        }
    
    async def run_async(self, input_data: Any) -> Dict[str, Any]:
        """Main orchestration entry point (async)"""
        start_time = time.time()
        
        try:
            if not self.validate_input(input_data):
                return self.handle_error(ValueError("Invalid input data"), input_data)
            
            # Determine workflow type based on input
            workflow_type = self._determine_workflow_type(input_data)
            
            # Execute appropriate workflow
            result = await self._execute_workflow_async(workflow_type, input_data)
            
            # Log execution
            execution_time = time.time() - start_time
            self.log_execution(input_data, result, execution_time)
            
            return result
            
        except Exception as e:
            return self.handle_error(e, input_data)
    
    def run(self, input_data: Any) -> Dict[str, Any]:
        """Main orchestration entry point (sync wrapper)"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(input_data))
        finally:
            loop.close()
    
    def orchestrate(self, agents: List[BaseLifeAssistantAgent], context: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate multiple agents with context"""
        try:
            workflow_type = context.get('workflow_type', 'sequential')
            
            if workflow_type == 'sequential':
                return self._execute_sequential_workflow(agents, context)
            elif workflow_type == 'parallel':
                return self._execute_parallel_workflow(agents, context)
            elif workflow_type == 'loop':
                return self._execute_loop_workflow(agents, context)
            else:
                raise ValueError(f"Unknown workflow type: {workflow_type}")
                
        except Exception as e:
            return self.handle_error(e, context)
    
    def get_capabilities(self) -> List[str]:
        """Return orchestrator capabilities"""
        return [
            "goal_creation_workflow",
            "goal_analysis_workflow", 
            "goal_refinement_workflow",
            "multi_agent_coordination",
            "sequential_workflows",
            "parallel_workflows",
            "loop_workflows",
            "agent_routing",
            "error_recovery"
        ]
    
    def _determine_workflow_type(self, input_data: Dict[str, Any]) -> str:
        """Determine which workflow to execute based on input"""
        action = input_data.get('action', '').lower()
        
        if action in ['create_goal', 'plan_goal']:
            return 'goal_creation'
        elif action in ['analyze_goal', 'evaluate_goal']:
            return 'goal_analysis'
        elif action in ['refine_goal', 'improve_goal']:
            return 'goal_refinement'
        else:
            # Default to goal creation for natural language input
            return 'goal_creation'
    
    async def _execute_workflow_async(self, workflow_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the specified workflow (async)"""
        if workflow_type not in self.workflow_templates:
            raise ValueError(f"Unknown workflow type: {workflow_type}")
        
        workflow_func = self.workflow_templates[workflow_type]
        return await workflow_func(input_data)
    
    def _execute_workflow(self, workflow_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the specified workflow (sync wrapper)"""
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self._execute_workflow_async(workflow_type, input_data))
        finally:
            loop.close()
    
    async def _create_goal_creation_workflow(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sequential workflow for goal creation (async)"""
        try:
            # Step 1: Create initial goal structure
            goal_result = await self.goal_planning_agent.run_async(input_data.get('input', ''))
            
            if not goal_result or 'agent_error' in goal_result:
                return {
                    'success': False,
                    'error': 'Goal creation failed',
                    'details': goal_result
                }
            
            # Step 2: Generate SMART criteria suggestions
            criteria_result = await self.smart_criteria_agent.run_async({
                'title': goal_result.get('goal', {}).get('title', ''),
                'description': goal_result.get('goal', {}).get('description', '')
            })
            
            # Step 3: Analyze the created goal
            analysis_result = await self.goal_analysis_agent.run_async(goal_result.get('goal', {}))
            
            # Combine results
            return {
                'success': True,
                'workflow_type': 'goal_creation',
                'goal': goal_result,
                'smart_criteria_suggestions': criteria_result,
                'initial_analysis': analysis_result,
                'next_steps': [
                    'Review and refine SMART criteria',
                    'Add specific milestones',
                    'Set up calendar integration',
                    'Begin tracking progress'
                ]
            }
            
        except Exception as e:
            return self.handle_error(e, input_data)
    
    async def _create_goal_analysis_workflow(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Workflow for analyzing existing goals (async)"""
        try:
            goal_data = input_data.get('goal', {})
            
            # Analyze the goal
            analysis_result = await self.goal_analysis_agent.run_async(goal_data)
            
            # Generate improvement suggestions
            criteria_suggestions = await self.smart_criteria_agent.run_async({
                'title': goal_data.get('title', ''),
                'description': goal_data.get('description', '')
            })
            
            return {
                'success': True,
                'workflow_type': 'goal_analysis',
                'analysis': analysis_result,
                'improvement_suggestions': criteria_suggestions,
                'recommendations': self._generate_improvement_recommendations(analysis_result.get('analysis', {}))
            }
            
        except Exception as e:
            return self.handle_error(e, input_data)
    
    async def _create_goal_refinement_workflow(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Loop workflow for iterative goal refinement (async)"""
        try:
            goal_data = input_data.get('goal', {})
            feedback = input_data.get('feedback', '')
            max_iterations = input_data.get('max_iterations', 3)
            
            current_goal = goal_data.copy()
            refinement_history = []
            
            for iteration in range(max_iterations):
                # Refine the goal
                refined_goal = await self.goal_planning_agent.refine_async(current_goal, feedback)
                
                # Analyze the refined goal
                analysis = await self.goal_analysis_agent.run_async(refined_goal)
                
                refinement_history.append({
                    'iteration': iteration + 1,
                    'goal': refined_goal,
                    'analysis': analysis,
                    'score': analysis.get('analysis', {}).get('overallScore', 0)
                })
                
                # Check if goal is good enough (score > 80)
                if analysis.get('analysis', {}).get('overallScore', 0) > 80:
                    break
                
                current_goal = refined_goal
                # Use analysis feedback for next iteration
                feedback = ' '.join(analysis.get('analysis', {}).get('recommendations', []))
            
            return {
                'success': True,
                'workflow_type': 'goal_refinement',
                'final_goal': current_goal,
                'refinement_history': refinement_history,
                'iterations_completed': len(refinement_history)
            }
            
        except Exception as e:
            return self.handle_error(e, input_data)
    
    def _execute_sequential_workflow(self, agents: List[BaseLifeAssistantAgent], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agents in sequence"""
        results = []
        current_data = context.get('input_data', {})
        
        for agent in agents:
            result = agent.run(current_data)
            results.append({
                'agent': agent.agent_name,
                'result': result
            })
            
            # Pass result to next agent
            if result.get('success', False):
                current_data = result
            else:
                # Stop on first failure
                break
        
        return {
            'success': True,
            'workflow_type': 'sequential',
            'results': results,
            'final_result': current_data
        }
    
    def _execute_parallel_workflow(self, agents: List[BaseLifeAssistantAgent], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agents in parallel"""
        input_data = context.get('input_data', {})
        results = []
        
        # In a real implementation, this would use actual parallel execution
        # For now, we'll simulate parallel execution
        for agent in agents:
            result = agent.run(input_data)
            results.append({
                'agent': agent.agent_name,
                'result': result
            })
        
        return {
            'success': True,
            'workflow_type': 'parallel',
            'results': results
        }
    
    def _execute_loop_workflow(self, agents: List[BaseLifeAssistantAgent], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agents in a loop until condition is met"""
        input_data = context.get('input_data', {})
        condition_fn = context.get('condition', lambda x: False)
        max_iterations = context.get('max_iterations', 5)
        
        results = []
        current_data = input_data
        
        for iteration in range(max_iterations):
            iteration_results = []
            
            for agent in agents:
                result = agent.run(current_data)
                iteration_results.append({
                    'agent': agent.agent_name,
                    'result': result
                })
                current_data = result
            
            results.append({
                'iteration': iteration + 1,
                'results': iteration_results
            })
            
            # Check exit condition
            if condition_fn(current_data):
                break
        
        return {
            'success': True,
            'workflow_type': 'loop',
            'results': results,
            'iterations_completed': len(results)
        }
    
    def _generate_improvement_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate actionable improvement recommendations"""
        recommendations = []
        
        overall_score = analysis.get('overallScore', 0)
        smart_analysis = analysis.get('smartAnalysis', {})
        
        if overall_score < 60:
            recommendations.append("Goal needs significant improvement across multiple SMART criteria")
        
        # Check each SMART criterion
        for criterion, data in smart_analysis.items():
            score = data.get('score', 0)
            if score < 70:
                recommendations.append(f"Improve {criterion} criterion - current score: {score}/100")
        
        # Add specific suggestions from analysis
        recommendations.extend(analysis.get('recommendations', []))
        
        return recommendations