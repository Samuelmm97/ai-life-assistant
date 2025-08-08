"""
Base Agent Interface for ADK Life Assistant Agents
Provides common interface and functionality for all domain agents
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json
import uuid
from datetime import datetime

class BaseLifeAssistantAgent(ABC):
    """Base class for all Life Assistant ADK agents"""
    
    def __init__(self, agent_name: str, agent_description: str, system_prompt: str, tools: Optional[List] = None, sub_agents: Optional[List] = None):
        self.agent_name = agent_name
        self.agent_description = agent_description
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.sub_agents = sub_agents or []
        self.agent_id = str(uuid.uuid4())
        self.created_at = datetime.now().isoformat()
        
        # Initialize ADK agent with proper configuration
        from adk_config import adk_config
        self.adk_agent = adk_config.create_agent(
            name=agent_name,
            description=agent_description,
            instruction=system_prompt,
            tools=tools,
            sub_agents=sub_agents
        )
        self.adk_config = adk_config
    
    @abstractmethod
    def run(self, input_data: Any) -> Dict[str, Any]:
        """Main execution method for the agent (sync)"""
        pass
    
    async def run_async(self, input_data: Any) -> Dict[str, Any]:
        """Main execution method for the agent (async) - override in subclasses"""
        # Default implementation calls sync version
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.run, input_data)
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        pass
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Return agent metadata"""
        return {
            'agent_id': self.agent_id,
            'agent_name': self.agent_name,
            'capabilities': self.get_capabilities(),
            'tools': [tool.name for tool in self.tools],
            'created_at': self.created_at
        }
    
    def validate_input(self, input_data: Any) -> bool:
        """Validate input data - override in subclasses"""
        return input_data is not None
    
    def handle_error(self, error: Exception, input_data: Any) -> Dict[str, Any]:
        """Standard error handling for agents"""
        return {
            'success': False,
            'error': str(error),
            'error_type': type(error).__name__,
            'agent_name': self.agent_name,
            'input_data': input_data,
            'timestamp': datetime.now().isoformat()
        }
    
    def log_execution(self, input_data: Any, output_data: Dict[str, Any], execution_time: float):
        """Log agent execution - can be extended for monitoring"""
        log_entry = {
            'agent_name': self.agent_name,
            'agent_id': self.agent_id,
            'execution_time': execution_time,
            'input_size': len(str(input_data)),
            'output_size': len(str(output_data)),
            'success': output_data.get('success', False),
            'timestamp': datetime.now().isoformat()
        }
        # In production, this would go to a proper logging system
        print(f"Agent Execution Log: {json.dumps(log_entry, indent=2)}")

class DomainAgent(BaseLifeAssistantAgent):
    """Base class for domain-specific agents (fitness, nutrition, etc.)"""
    
    def __init__(self, domain: str, agent_name: str, system_prompt: str, tools: Optional[List] = None):
        super().__init__(agent_name, system_prompt, tools)
        self.domain = domain
    
    @abstractmethod
    def create_plan(self, goal_data: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Create a domain-specific plan"""
        pass
    
    @abstractmethod
    def update_plan(self, plan_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing plan"""
        pass
    
    @abstractmethod
    def get_schedule_requirements(self, plan_id: str) -> List[Dict[str, Any]]:
        """Get scheduling requirements for the plan"""
        pass
    
    def get_domain_info(self) -> Dict[str, Any]:
        """Return domain-specific metadata"""
        info = self.get_agent_info()
        info['domain'] = self.domain
        return info

class WorkflowAgent(BaseLifeAssistantAgent):
    """Base class for workflow orchestration agents"""
    
    def __init__(self, workflow_type: str, agent_name: str, system_prompt: str, tools: Optional[List] = None):
        super().__init__(agent_name, system_prompt, tools)
        self.workflow_type = workflow_type  # 'sequential', 'parallel', 'loop'
    
    @abstractmethod
    def orchestrate(self, agents: List[BaseLifeAssistantAgent], context: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate multiple agents"""
        pass
    
    def get_workflow_info(self) -> Dict[str, Any]:
        """Return workflow-specific metadata"""
        info = self.get_agent_info()
        info['workflow_type'] = self.workflow_type
        return info