// ADK Agent System - Central initialization and management for all agents
import { AgentOrchestrator } from './core/AgentOrchestrator';
import { SequentialWorkflowAgent } from './workflows/SequentialWorkflow';
import { ParallelWorkflowAgent } from './workflows/ParallelWorkflow';
import { LoopWorkflowAgent } from './workflows/LoopWorkflow';
import { MasterWorkflowAgent } from './domain/MasterWorkflowAgent';
import { SMARTGoalAgent } from './domain/SMARTGoalAgent';
import { SchedulerAgent } from './domain/SchedulerAgent';
import { AnalyticsAgent } from './domain/AnalyticsAgent';
import { FitnessAgent } from './domain/FitnessAgent';
import { NutritionAgent } from './domain/NutritionAgent';
import { FinanceAgent } from './domain/FinanceAgent';
import { LearningAgent } from './domain/LearningAgent';
import { HealthAgent } from './domain/HealthAgent';
import { SleepAgent } from './domain/SleepAgent';
import { HabitsAgent } from './domain/HabitsAgent';
import { CareerAgent } from './domain/CareerAgent';
import { SocialAgent } from './domain/SocialAgent';
import { ProjectsAgent } from './domain/ProjectsAgent';

export class AgentSystem {
    private orchestrator: AgentOrchestrator;
    private initialized: boolean = false;

    constructor() {
        this.orchestrator = new AgentOrchestrator();
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('Agent system already initialized');
            return;
        }

        try {
            console.log('Initializing ADK Agent System...');

            // Initialize workflow agents
            const sequentialWorkflow = new SequentialWorkflowAgent();
            const parallelWorkflow = new ParallelWorkflowAgent();
            const loopWorkflow = new LoopWorkflowAgent();

            await sequentialWorkflow.initialize();
            await parallelWorkflow.initialize();
            await loopWorkflow.initialize();

            this.orchestrator.registerAgent('workflow_sequential', sequentialWorkflow);
            this.orchestrator.registerAgent('workflow_parallel', parallelWorkflow);
            this.orchestrator.registerAgent('workflow_loop', loopWorkflow);

            // Initialize core agents
            const smartGoalAgent = new SMARTGoalAgent();
            const schedulerAgent = new SchedulerAgent();
            const analyticsAgent = new AnalyticsAgent();

            await smartGoalAgent.initialize();
            await schedulerAgent.initialize();
            await analyticsAgent.initialize();

            this.orchestrator.registerAgent('smart_goal', smartGoalAgent);
            this.orchestrator.registerAgent('scheduler', schedulerAgent);
            this.orchestrator.registerAgent('analytics', analyticsAgent);

            // Initialize domain-specific agents
            const fitnessAgent = new FitnessAgent();
            const nutritionAgent = new NutritionAgent();
            const financeAgent = new FinanceAgent();
            const learningAgent = new LearningAgent();
            const healthAgent = new HealthAgent();
            const sleepAgent = new SleepAgent();
            const habitsAgent = new HabitsAgent();
            const careerAgent = new CareerAgent();
            const socialAgent = new SocialAgent();
            const projectsAgent = new ProjectsAgent();

            await Promise.all([
                fitnessAgent.initialize(),
                nutritionAgent.initialize(),
                financeAgent.initialize(),
                learningAgent.initialize(),
                healthAgent.initialize(),
                sleepAgent.initialize(),
                habitsAgent.initialize(),
                careerAgent.initialize(),
                socialAgent.initialize(),
                projectsAgent.initialize()
            ]);

            this.orchestrator.registerAgent('fitness', fitnessAgent);
            this.orchestrator.registerAgent('nutrition', nutritionAgent);
            this.orchestrator.registerAgent('finance', financeAgent);
            this.orchestrator.registerAgent('learning', learningAgent);
            this.orchestrator.registerAgent('health', healthAgent);
            this.orchestrator.registerAgent('sleep', sleepAgent);
            this.orchestrator.registerAgent('habits', habitsAgent);
            this.orchestrator.registerAgent('career', careerAgent);
            this.orchestrator.registerAgent('social', socialAgent);
            this.orchestrator.registerAgent('projects', projectsAgent);

            // Initialize master workflow agent (must be last as it depends on orchestrator)
            const masterWorkflowAgent = new MasterWorkflowAgent(this.orchestrator);
            await masterWorkflowAgent.initialize();
            this.orchestrator.registerAgent('coordination', masterWorkflowAgent);

            this.initialized = true;
            console.log('ADK Agent System initialized successfully');
            console.log(`Registered ${this.orchestrator.getRegisteredDomains().length} agents`);

        } catch (error) {
            console.error('Failed to initialize Agent System:', error);
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        if (!this.initialized) {
            console.log('Agent system not initialized');
            return;
        }

        try {
            console.log('Shutting down ADK Agent System...');
            await this.orchestrator.shutdown();
            this.initialized = false;
            console.log('ADK Agent System shut down successfully');
        } catch (error) {
            console.error('Error during Agent System shutdown:', error);
            throw error;
        }
    }

    getOrchestrator(): AgentOrchestrator {
        if (!this.initialized) {
            throw new Error('Agent system not initialized. Call initialize() first.');
        }
        return this.orchestrator;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getRegisteredAgents(): string[] {
        return this.orchestrator.getRegisteredDomains();
    }

    // Convenience methods for common operations
    async executeGoalCreation(userId: string, goalDescription: string, domain: string): Promise<any> {
        if (!this.initialized) {
            throw new Error('Agent system not initialized');
        }

        const context = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalDescription, domain },
            timestamp: new Date()
        };

        const masterAgent = this.orchestrator.getAgent('coordination');
        if (!masterAgent) {
            throw new Error('Master workflow agent not found');
        }

        return await masterAgent.execute(context, {
            action: 'coordinate_goal_creation',
            goalDescription,
            domain
        });
    }

    async executeGoalProgress(userId: string, goalId: string): Promise<any> {
        if (!this.initialized) {
            throw new Error('Agent system not initialized');
        }

        const context = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalId },
            timestamp: new Date()
        };

        const analyticsAgent = this.orchestrator.getAgent('analytics');
        if (!analyticsAgent) {
            throw new Error('Analytics agent not found');
        }

        return await analyticsAgent.execute(context, {
            action: 'track_progress',
            goalId
        });
    }

    async executeScheduleIntegration(userId: string, goalId: string): Promise<any> {
        if (!this.initialized) {
            throw new Error('Agent system not initialized');
        }

        const context = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalId },
            timestamp: new Date()
        };

        const schedulerAgent = this.orchestrator.getAgent('scheduler');
        if (!schedulerAgent) {
            throw new Error('Scheduler agent not found');
        }

        return await schedulerAgent.execute(context, {
            action: 'integrate_schedule',
            goalId
        });
    }

    // Health check method
    async healthCheck(): Promise<{ status: string; agents: Record<string, string> }> {
        const agents = this.orchestrator.getRegisteredDomains();
        const agentStatus: Record<string, string> = {};

        for (const domain of agents) {
            const agent = this.orchestrator.getAgent(domain);
            agentStatus[domain] = agent ? 'healthy' : 'unavailable';
        }

        return {
            status: this.initialized ? 'healthy' : 'not_initialized',
            agents: agentStatus
        };
    }
}

// Singleton instance for global access
let agentSystemInstance: AgentSystem | null = null;

export function getAgentSystem(): AgentSystem {
    if (!agentSystemInstance) {
        agentSystemInstance = new AgentSystem();
    }
    return agentSystemInstance;
}

export async function initializeAgentSystem(): Promise<AgentSystem> {
    const system = getAgentSystem();
    if (!system.isInitialized()) {
        await system.initialize();
    }
    return system;
}

export async function shutdownAgentSystem(): Promise<void> {
    if (agentSystemInstance) {
        await agentSystemInstance.shutdown();
        agentSystemInstance = null;
    }
}