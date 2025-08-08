// ADK Agent Orchestrator - Central coordination for multi-agent systems
import { ADKAgent, AgentContext, WorkflowResult, CoordinationContext, CoordinationResult } from './ADKAgent';
import { WorkflowAgent, WorkflowDefinition } from './WorkflowAgent';

export interface AgentRegistry {
    [domain: string]: ADKAgent;
}

export interface OrchestrationRequest {
    initiatingAgent: string;
    targetDomains: string[];
    workflow?: string;
    context: AgentContext;
    parameters: Record<string, any>;
}

export interface OrchestrationResult {
    success: boolean;
    results: Record<string, WorkflowResult>;
    errors?: Record<string, string>;
    executionTime: number;
}

export class AgentOrchestrator {
    private agents: AgentRegistry;
    private workflowAgents: Map<string, WorkflowAgent>;
    private activeOrchestrations: Map<string, OrchestrationRequest>;

    constructor() {
        this.agents = {};
        this.workflowAgents = new Map();
        this.activeOrchestrations = new Map();
    }

    // Agent Registration
    registerAgent(domain: string, agent: ADKAgent): void {
        this.agents[domain] = agent;

        if (agent instanceof WorkflowAgent) {
            this.workflowAgents.set(domain, agent);
        }
    }

    unregisterAgent(domain: string): boolean {
        if (this.agents[domain]) {
            delete this.agents[domain];
            this.workflowAgents.delete(domain);
            return true;
        }
        return false;
    }

    getAgent(domain: string): ADKAgent | undefined {
        return this.agents[domain];
    }

    getRegisteredDomains(): string[] {
        return Object.keys(this.agents);
    }

    // Multi-Agent Orchestration
    async orchestrateAgents(request: OrchestrationRequest): Promise<OrchestrationResult> {
        const startTime = Date.now();
        const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.activeOrchestrations.set(orchestrationId, request);

        try {
            const results: Record<string, WorkflowResult> = {};
            const errors: Record<string, string> = {};

            // Execute agents in parallel for better performance
            const agentPromises = request.targetDomains.map(async (domain) => {
                const agent = this.agents[domain];
                if (!agent) {
                    errors[domain] = `Agent for domain ${domain} not found`;
                    return;
                }

                try {
                    const result = await agent.execute(request.context, request.parameters);
                    results[domain] = result;
                } catch (error) {
                    errors[domain] = error instanceof Error ? error.message : 'Unknown execution error';
                }
            });

            await Promise.all(agentPromises);

            this.activeOrchestrations.delete(orchestrationId);

            return {
                success: Object.keys(errors).length === 0,
                results,
                errors: Object.keys(errors).length > 0 ? errors : undefined,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            this.activeOrchestrations.delete(orchestrationId);

            return {
                success: false,
                results: {},
                errors: { orchestrator: error instanceof Error ? error.message : 'Orchestration error' },
                executionTime: Date.now() - startTime
            };
        }
    }

    // Workflow Orchestration
    async executeWorkflow(workflowId: string, domain: string, context: AgentContext, parameters: Record<string, any> = {}): Promise<WorkflowResult> {
        const workflowAgent = this.workflowAgents.get(domain);
        if (!workflowAgent) {
            return {
                success: false,
                error: `No workflow agent found for domain ${domain}`,
                executionTime: 0,
                agentId: 'orchestrator'
            };
        }

        return await workflowAgent.executeWorkflow(workflowId, context, parameters);
    }

    // Agent Transfer Support
    async transferBetweenAgents(fromDomain: string, toDomain: string, context: AgentContext): Promise<WorkflowResult> {
        const fromAgent = this.agents[fromDomain];
        const toAgent = this.agents[toDomain];

        if (!fromAgent || !toAgent) {
            return {
                success: false,
                error: `Agent not found: ${!fromAgent ? fromDomain : toDomain}`,
                executionTime: 0,
                agentId: 'orchestrator'
            };
        }

        try {
            // Perform the transfer
            const transferResult = await fromAgent.transferToAgent(toDomain, context);

            if (transferResult.success) {
                // Execute the target agent
                return await toAgent.execute(transferResult.transferredContext);
            } else {
                return {
                    success: false,
                    error: transferResult.error || 'Transfer failed',
                    executionTime: 0,
                    agentId: fromDomain
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Transfer execution error',
                executionTime: 0,
                agentId: fromDomain
            };
        }
    }

    // Coordination Support
    async coordinateMultipleDomains(context: CoordinationContext): Promise<CoordinationResult> {
        const responses: Record<string, any> = {};
        const conflicts: string[] = [];

        for (const domain of context.targetDomains) {
            const agent = this.agents[domain];
            if (agent) {
                try {
                    const result = await agent.coordinateWithOtherDomains(
                        context.targetDomains.filter(d => d !== domain),
                        context
                    );
                    responses[domain] = result;
                } catch (error) {
                    conflicts.push(`${domain}: ${error instanceof Error ? error.message : 'Coordination error'}`);
                }
            } else {
                conflicts.push(`${domain}: Agent not found`);
            }
        }

        return {
            success: conflicts.length === 0,
            responses,
            conflicts: conflicts.length > 0 ? conflicts : undefined
        };
    }

    // Status and Monitoring
    getActiveOrchestrations(): string[] {
        return Array.from(this.activeOrchestrations.keys());
    }

    getOrchestrationStatus(orchestrationId: string): OrchestrationRequest | undefined {
        return this.activeOrchestrations.get(orchestrationId);
    }

    // Cleanup
    async shutdown(): Promise<void> {
        // Cancel all active orchestrations
        this.activeOrchestrations.clear();

        // Cleanup all agents
        const cleanupPromises = Object.values(this.agents).map(agent => agent.cleanup());
        await Promise.all(cleanupPromises);

        // Clear registries
        this.agents = {};
        this.workflowAgents.clear();
    }
}