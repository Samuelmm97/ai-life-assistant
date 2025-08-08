// ADK Agent System Service - Central management for all ADK agents
import { AgentOrchestrator } from '../agents/core/AgentOrchestrator';
import { SchedulerAgent } from '../agents/domain/SchedulerAgent';
import { SMARTGoalAgent } from '../agents/domain/SMARTGoalAgent';
import { AnalyticsAgent } from '../agents/domain/AnalyticsAgent';
import { SequentialWorkflowAgent } from '../agents/workflows/SequentialWorkflow';
import { ParallelWorkflowAgent } from '../agents/workflows/ParallelWorkflow';
import { LoopWorkflowAgent } from '../agents/workflows/LoopWorkflow';
import { AgentContext, WorkflowResult } from '../agents/core/ADKAgent';

export class ADKAgentSystemService {
    private orchestrator: AgentOrchestrator;
    private schedulerAgent: SchedulerAgent;
    private smartGoalAgent: SMARTGoalAgent;
    private analyticsAgent: AnalyticsAgent;
    private sequentialWorkflow: SequentialWorkflowAgent;
    private parallelWorkflow: ParallelWorkflowAgent;
    private loopWorkflow: LoopWorkflowAgent;
    private initialized: boolean = false;

    constructor() {
        this.orchestrator = new AgentOrchestrator();
        this.schedulerAgent = new SchedulerAgent();
        this.smartGoalAgent = new SMARTGoalAgent();
        this.analyticsAgent = new AnalyticsAgent();
        this.sequentialWorkflow = new SequentialWorkflowAgent();
        this.parallelWorkflow = new ParallelWorkflowAgent();
        this.loopWorkflow = new LoopWorkflowAgent();
    }

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize all agents
            await Promise.all([
                this.schedulerAgent.initialize(),
                this.smartGoalAgent.initialize(),
                this.analyticsAgent.initialize(),
                this.sequentialWorkflow.initialize(),
                this.parallelWorkflow.initialize(),
                this.loopWorkflow.initialize()
            ]);

            // Register agents with orchestrator
            this.orchestrator.registerAgent('scheduler', this.schedulerAgent);
            this.orchestrator.registerAgent('smart_goal', this.smartGoalAgent);
            this.orchestrator.registerAgent('analytics', this.analyticsAgent);
            this.orchestrator.registerAgent('sequential_workflow', this.sequentialWorkflow);
            this.orchestrator.registerAgent('parallel_workflow', this.parallelWorkflow);
            this.orchestrator.registerAgent('loop_workflow', this.loopWorkflow);

            this.initialized = true;
            console.log('ADK Agent System initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ADK Agent System:', error);
            throw error;
        }
    }

    // Agent execution methods
    async executeSchedulerAgent(context: AgentContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.schedulerAgent.execute(context, parameters);
    }

    async executeSMARTGoalAgent(context: AgentContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.smartGoalAgent.execute(context, parameters);
    }

    async executeAnalyticsAgent(context: AgentContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.analyticsAgent.execute(context, parameters);
    }

    // Workflow execution methods
    async executeSequentialWorkflow(workflowId: string, context: AgentContext, parameters: Record<string, any> = {}): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.orchestrator.executeWorkflow(workflowId, 'sequential_workflow', context, parameters);
    }

    async executeParallelWorkflow(workflowId: string, context: AgentContext, parameters: Record<string, any> = {}): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.orchestrator.executeWorkflow(workflowId, 'parallel_workflow', context, parameters);
    }

    async executeLoopWorkflow(workflowId: string, context: AgentContext, parameters: Record<string, any> = {}): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.orchestrator.executeWorkflow(workflowId, 'loop_workflow', context, parameters);
    }

    // Multi-agent orchestration
    async orchestrateAgents(
        initiatingAgent: string,
        targetDomains: string[],
        context: AgentContext,
        parameters: Record<string, any>
    ): Promise<any> {
        await this.ensureInitialized();

        return await this.orchestrator.orchestrateAgents({
            initiatingAgent,
            targetDomains,
            context,
            parameters
        });
    }

    // Agent transfer
    async transferBetweenAgents(fromDomain: string, toDomain: string, context: AgentContext): Promise<WorkflowResult> {
        await this.ensureInitialized();
        return await this.orchestrator.transferBetweenAgents(fromDomain, toDomain, context);
    }

    // Goal-specific workflows
    async createGoalWithADK(userId: string, goalData: any): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalData },
            timestamp: new Date()
        };

        // Use sequential workflow: SMART Goal creation -> Schedule integration -> Analytics setup
        const workflowResult = await this.orchestrateAgents(
            'smart_goal',
            ['smart_goal', 'scheduler', 'analytics'],
            context,
            {
                action: 'create_goal_workflow',
                goalData
            }
        );

        return {
            success: workflowResult.success,
            data: workflowResult.results,
            error: workflowResult.errors ? Object.values(workflowResult.errors).join(', ') : undefined,
            executionTime: workflowResult.executionTime,
            agentId: 'agent_system'
        };
    }

    async updateGoalWithADK(userId: string, goalId: string, updates: any): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalId, updates },
            timestamp: new Date()
        };

        // Use parallel workflow for efficient updates across domains
        const workflowResult = await this.orchestrateAgents(
            'smart_goal',
            ['smart_goal', 'scheduler', 'analytics'],
            context,
            {
                action: 'update_goal_workflow',
                goalId,
                updates
            }
        );

        return {
            success: workflowResult.success,
            data: workflowResult.results,
            error: workflowResult.errors ? Object.values(workflowResult.errors).join(', ') : undefined,
            executionTime: workflowResult.executionTime,
            agentId: 'agent_system'
        };
    }

    async trackGoalProgressWithADK(userId: string, goalId: string): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goalId },
            timestamp: new Date()
        };

        // Use loop workflow for continuous progress tracking
        return await this.executeAnalyticsAgent(context, {
            action: 'track_goal_progress',
            goalId
        });
    }

    // Calendar-specific workflows
    async optimizeScheduleWithADK(userId: string): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: {},
            timestamp: new Date()
        };

        return await this.executeSchedulerAgent(context, {
            action: 'optimize_schedule'
        });
    }

    async resolveScheduleConflictsWithADK(userId: string, conflicts: any[]): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { conflicts },
            timestamp: new Date()
        };

        return await this.executeSchedulerAgent(context, {
            action: 'resolve_conflicts',
            conflicts
        });
    }

    // System management
    getRegisteredAgents(): string[] {
        return this.orchestrator.getRegisteredDomains();
    }

    getActiveOrchestrations(): string[] {
        return this.orchestrator.getActiveOrchestrations();
    }

    async registerDomainAgent(domain: string, agent: any): Promise<void> {
        await this.ensureInitialized();
        await agent.initialize();
        this.orchestrator.registerAgent(domain, agent);
    }

    // Cleanup
    async cleanup(): Promise<void> {
        if (this.initialized) {
            await this.orchestrator.shutdown();
            this.initialized = false;
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}

// Singleton instance for global access
export const adkAgentSystem = new ADKAgentSystemService();