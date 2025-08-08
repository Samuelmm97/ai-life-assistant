// Master Workflow Agent - Central coordination for AI Life Assistant
import { WorkflowAgent, WorkflowDefinition, WorkflowContext } from '../core/WorkflowAgent';
import { AgentContext, WorkflowResult, CoordinationContext, CoordinationResult } from '../core/ADKAgent';
import { AgentOrchestrator } from '../core/AgentOrchestrator';
import { LifeDomain } from '../../types';

export interface LifeGoalContext extends AgentContext {
    goalId?: string;
    domain: LifeDomain;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeframe: {
        start: Date;
        end: Date;
    };
}

export class MasterWorkflowAgent extends WorkflowAgent {
    private orchestrator: AgentOrchestrator;
    private domainAgents: Map<LifeDomain, string>;

    constructor(orchestrator: AgentOrchestrator) {
        super('MasterWorkflow', 'coordination', [
            'goal_orchestration',
            'multi_domain_coordination',
            'workflow_management',
            'agent_delegation'
        ]);

        this.orchestrator = orchestrator;
        this.domainAgents = new Map();
        this.initializeWorkflows();
    }

    async initialize(): Promise<void> {
        // Register domain agent mappings
        this.domainAgents.set(LifeDomain.FITNESS, 'fitness');
        this.domainAgents.set(LifeDomain.NUTRITION, 'nutrition');
        this.domainAgents.set(LifeDomain.FINANCE, 'finance');
        this.domainAgents.set(LifeDomain.LEARNING, 'learning');
        this.domainAgents.set(LifeDomain.HEALTH, 'health');
        this.domainAgents.set(LifeDomain.SLEEP, 'sleep');
        this.domainAgents.set(LifeDomain.HABITS, 'habits');
        this.domainAgents.set(LifeDomain.CAREER, 'career');
        this.domainAgents.set(LifeDomain.SOCIAL, 'social');
        this.domainAgents.set(LifeDomain.PROJECTS, 'projects');

        console.log('Master Workflow Agent initialized with domain mappings');
    }

    async execute(context: AgentContext, parameters?: Record<string, any>): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            const action = parameters?.action || 'coordinate_goal_creation';

            switch (action) {
                case 'coordinate_goal_creation':
                    return await this.coordinateGoalCreation(context as LifeGoalContext, parameters || {});

                case 'coordinate_goal_execution':
                    return await this.coordinateGoalExecution(context as LifeGoalContext, parameters || {});

                case 'coordinate_progress_tracking':
                    return await this.coordinateProgressTracking(context as LifeGoalContext, parameters || {});

                case 'coordinate_multi_domain':
                    return await this.coordinateMultiDomainGoal(context as LifeGoalContext, parameters || {});

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                        executionTime: Date.now() - startTime,
                        agentId: this.id
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Master workflow execution error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    async cleanup(): Promise<void> {
        console.log('Master Workflow Agent cleaned up');
    }

    // Goal Creation Coordination
    private async coordinateGoalCreation(context: LifeGoalContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            // Step 1: Analyze goal requirements with SMART Goal Agent
            const smartGoalResult = await this.orchestrator.transferBetweenAgents(
                'coordination',
                'smart_goal',
                context
            );

            if (!smartGoalResult.success) {
                return smartGoalResult;
            }

            // Step 2: Coordinate with relevant domain agents
            const domainAgent = this.domainAgents.get(context.domain);
            if (domainAgent) {
                const domainResult = await this.orchestrator.transferBetweenAgents(
                    'coordination',
                    domainAgent,
                    context
                );

                if (!domainResult.success) {
                    return domainResult;
                }
            }

            // Step 3: Schedule and calendar integration
            const schedulerResult = await this.orchestrator.transferBetweenAgents(
                'coordination',
                'scheduler',
                context
            );

            return {
                success: true,
                data: {
                    action: 'goal_creation_coordinated',
                    smartGoalAnalysis: smartGoalResult.data,
                    domainSpecificPlan: domainAgent ? 'completed' : 'not_applicable',
                    schedulingResult: schedulerResult.data
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal creation coordination error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    // Multi-Domain Goal Coordination
    private async coordinateMultiDomainGoal(context: LifeGoalContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        const startTime = Date.now();
        const domains = parameters.domains as LifeDomain[] || [context.domain];

        try {
            const coordinationContext: CoordinationContext = {
                initiatingAgent: this.id,
                targetDomains: domains.map(domain => this.domainAgents.get(domain)).filter(Boolean) as string[],
                sharedData: {
                    goalId: context.goalId,
                    userId: context.userId,
                    timeframe: context.timeframe,
                    priority: context.priority
                },
                priority: context.priority === 'critical' ? 'high' : context.priority
            };

            const coordinationResult = await this.orchestrator.coordinateMultipleDomains(coordinationContext);

            return {
                success: coordinationResult.success,
                data: {
                    action: 'multi_domain_coordination',
                    domains,
                    coordinationResult: coordinationResult.responses,
                    conflicts: coordinationResult.conflicts
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Multi-domain coordination error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    // Goal Execution Coordination
    private async coordinateGoalExecution(context: LifeGoalContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            // Execute sequential workflow for goal execution
            const workflowResult = await this.executeWorkflow('goal_execution_workflow', context, parameters);

            return {
                success: workflowResult.success,
                data: {
                    action: 'goal_execution_coordinated',
                    workflowResult: workflowResult.data
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal execution coordination error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    // Progress Tracking Coordination
    private async coordinateProgressTracking(context: LifeGoalContext, parameters: Record<string, any>): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            // Coordinate with analytics agent and relevant domain agent
            const targetDomains = ['analytics'];
            const domainAgent = this.domainAgents.get(context.domain);
            if (domainAgent) {
                targetDomains.push(domainAgent);
            }

            const orchestrationResult = await this.orchestrator.orchestrateAgents({
                initiatingAgent: this.id,
                targetDomains,
                context,
                parameters
            });

            return {
                success: orchestrationResult.success,
                data: {
                    action: 'progress_tracking_coordinated',
                    results: orchestrationResult.results,
                    errors: orchestrationResult.errors
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Progress tracking coordination error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    // Initialize predefined workflows
    private initializeWorkflows(): void {
        // Goal Creation Workflow
        const goalCreationWorkflow: WorkflowDefinition = {
            id: 'goal_creation_workflow',
            name: 'SMART Goal Creation and Planning',
            type: 'sequential',
            steps: [
                {
                    id: 'analyze_smart_criteria',
                    agentId: 'smart_goal',
                    parameters: { action: 'analyze_criteria' }
                },
                {
                    id: 'domain_specific_planning',
                    agentId: 'domain_agent',
                    parameters: { action: 'create_domain_plan' }
                },
                {
                    id: 'schedule_integration',
                    agentId: 'scheduler',
                    parameters: { action: 'integrate_schedule' }
                }
            ],
            maxRetries: 3,
            timeout: 30000
        };

        // Goal Execution Workflow
        const goalExecutionWorkflow: WorkflowDefinition = {
            id: 'goal_execution_workflow',
            name: 'Goal Execution and Monitoring',
            type: 'parallel',
            steps: [
                {
                    id: 'execute_domain_actions',
                    agentId: 'domain_agent',
                    parameters: { action: 'execute_actions' }
                },
                {
                    id: 'track_progress',
                    agentId: 'analytics',
                    parameters: { action: 'track_progress' }
                },
                {
                    id: 'update_schedule',
                    agentId: 'scheduler',
                    parameters: { action: 'update_schedule' }
                }
            ],
            maxRetries: 2,
            timeout: 60000
        };

        this.registerWorkflow(goalCreationWorkflow);
        this.registerWorkflow(goalExecutionWorkflow);
    }

    // Workflow execution implementations
    protected async executeSequentialWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult> {
        const startTime = Date.now();
        const results: any[] = [];

        try {
            for (const step of workflow.steps) {
                console.log(`Master workflow executing step: ${step.id}`);

                // Determine target agent based on step configuration
                let targetAgent = step.agentId;
                if (step.agentId === 'domain_agent') {
                    const lifeContext = context.context as LifeGoalContext;
                    targetAgent = this.domainAgents.get(lifeContext.domain) || 'smart_goal';
                }

                // Execute step through orchestrator
                const stepResult = await this.orchestrator.transferBetweenAgents(
                    this.domain,
                    targetAgent,
                    context.context
                );

                results.push({
                    stepId: step.id,
                    targetAgent,
                    result: stepResult
                });

                if (!stepResult.success) {
                    return {
                        success: false,
                        error: `Sequential step ${step.id} failed: ${stepResult.error}`,
                        data: results,
                        executionTime: Date.now() - startTime,
                        agentId: this.id
                    };
                }
            }

            return {
                success: true,
                data: {
                    workflowType: 'sequential',
                    steps: results,
                    totalSteps: workflow.steps.length
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Sequential workflow execution error',
                data: results,
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    protected async executeParallelWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            const stepPromises = workflow.steps.map(async (step) => {
                let targetAgent = step.agentId;
                if (step.agentId === 'domain_agent') {
                    const lifeContext = context.context as LifeGoalContext;
                    targetAgent = this.domainAgents.get(lifeContext.domain) || 'smart_goal';
                }

                const stepResult = await this.orchestrator.transferBetweenAgents(
                    this.domain,
                    targetAgent,
                    context.context
                );

                return {
                    stepId: step.id,
                    targetAgent,
                    result: stepResult
                };
            });

            const results = await Promise.all(stepPromises);
            const failedSteps = results.filter(result => !result.result.success);

            return {
                success: failedSteps.length === 0,
                data: {
                    workflowType: 'parallel',
                    steps: results,
                    totalSteps: workflow.steps.length,
                    failedSteps: failedSteps.length
                },
                executionTime: Date.now() - startTime,
                agentId: this.id
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Parallel workflow execution error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    protected async executeLoopWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult> {
        // Master workflow agent delegates loop workflows to the loop workflow agent
        return await this.orchestrator.executeWorkflow(workflow.id, 'workflow_loop', context.context, context.parameters);
    }
}