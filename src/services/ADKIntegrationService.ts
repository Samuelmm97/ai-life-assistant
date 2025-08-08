// ADK Integration Service - Connects ADK agents with the AI Life Assistant application
import { getAgentSystem, initializeAgentSystem, AgentSystem } from '../agents/AgentSystem';
import { SMARTGoal, LifeDomain } from '../types';

export class ADKIntegrationService {
    private agentSystem: AgentSystem | null = null;
    private initialized: boolean = false;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            console.log('Initializing ADK Integration Service...');
            this.agentSystem = await initializeAgentSystem();
            this.initialized = true;
            console.log('ADK Integration Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ADK Integration Service:', error);
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        if (this.agentSystem) {
            await this.agentSystem.shutdown();
            this.agentSystem = null;
            this.initialized = false;
        }
    }

    // Goal Creation with ADK Agents
    async createSMARTGoalWithAI(
        userId: string,
        goalDescription: string,
        domain: LifeDomain
    ): Promise<{
        success: boolean;
        smartAnalysis?: any;
        domainPlan?: any;
        schedule?: any;
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const result = await this.agentSystem!.executeGoalCreation(
                userId,
                goalDescription,
                domain
            );

            return {
                success: result.success,
                smartAnalysis: result.data?.smartGoalAnalysis,
                domainPlan: result.data?.domainSpecificPlan,
                schedule: result.data?.schedulingResult,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal creation failed'
            };
        }
    }

    // Progress Tracking with Analytics Agent
    async trackGoalProgress(
        userId: string,
        goalId: string
    ): Promise<{
        success: boolean;
        analysis?: any;
        insights?: string[];
        recommendations?: string[];
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const result = await this.agentSystem!.executeGoalProgress(userId, goalId);

            return {
                success: result.success,
                analysis: result.data?.analysis,
                insights: result.data?.insights,
                recommendations: result.data?.recommendations,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Progress tracking failed'
            };
        }
    }

    // Schedule Integration with Scheduler Agent
    async integrateGoalSchedule(
        userId: string,
        goalId: string
    ): Promise<{
        success: boolean;
        scheduleEntries?: any[];
        conflicts?: any[];
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const result = await this.agentSystem!.executeScheduleIntegration(userId, goalId);

            return {
                success: result.success,
                scheduleEntries: result.data?.scheduleEntries,
                conflicts: result.data?.conflicts,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Schedule integration failed'
            };
        }
    }

    // Domain-Specific Planning
    async createDomainSpecificPlan(
        userId: string,
        domain: LifeDomain,
        goalContext: any
    ): Promise<{
        success: boolean;
        plan?: any;
        recommendations?: string[];
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const orchestrator = this.agentSystem!.getOrchestrator();
            const domainAgent = orchestrator.getAgent(domain);

            if (!domainAgent) {
                return {
                    success: false,
                    error: `No agent found for domain: ${domain}`
                };
            }

            const context = {
                userId,
                sessionId: `session_${Date.now()}`,
                metadata: goalContext,
                timestamp: new Date()
            };

            const result = await domainAgent.execute(context, {
                action: 'create_domain_plan',
                ...goalContext
            });

            return {
                success: result.success,
                plan: result.data?.plan,
                recommendations: result.data?.recommendations,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Domain planning failed'
            };
        }
    }

    // Multi-Agent Coordination
    async coordinateMultiDomainGoal(
        userId: string,
        domains: LifeDomain[],
        goalContext: any
    ): Promise<{
        success: boolean;
        coordination?: any;
        conflicts?: string[];
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const orchestrator = this.agentSystem!.getOrchestrator();
            const masterAgent = orchestrator.getAgent('coordination');

            if (!masterAgent) {
                return {
                    success: false,
                    error: 'Master workflow agent not available'
                };
            }

            const context = {
                userId,
                sessionId: `session_${Date.now()}`,
                metadata: { domains, ...goalContext },
                timestamp: new Date()
            };

            const result = await masterAgent.execute(context, {
                action: 'coordinate_multi_domain',
                domains,
                ...goalContext
            });

            return {
                success: result.success,
                coordination: result.data?.coordinationResult,
                conflicts: result.data?.conflicts,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Multi-domain coordination failed'
            };
        }
    }

    // Health Check
    async getSystemHealth(): Promise<{
        status: string;
        agents: Record<string, string>;
        initialized: boolean;
    }> {
        if (!this.initialized || !this.agentSystem) {
            return {
                status: 'not_initialized',
                agents: {},
                initialized: false
            };
        }

        try {
            const health = await this.agentSystem.healthCheck();
            return {
                ...health,
                initialized: this.initialized
            };
        } catch (error) {
            return {
                status: 'error',
                agents: {},
                initialized: this.initialized
            };
        }
    }

    // Get Available Agents
    getAvailableAgents(): string[] {
        if (!this.initialized || !this.agentSystem) {
            return [];
        }

        return this.agentSystem.getRegisteredAgents();
    }

    // Direct Agent Access (for advanced use cases)
    async executeAgentAction(
        agentDomain: string,
        userId: string,
        action: string,
        parameters: Record<string, any> = {}
    ): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        if (!this.initialized || !this.agentSystem) {
            await this.initialize();
        }

        try {
            const orchestrator = this.agentSystem!.getOrchestrator();
            const agent = orchestrator.getAgent(agentDomain);

            if (!agent) {
                return {
                    success: false,
                    error: `Agent not found: ${agentDomain}`
                };
            }

            const context = {
                userId,
                sessionId: `session_${Date.now()}`,
                metadata: parameters,
                timestamp: new Date()
            };

            const result = await agent.execute(context, { action, ...parameters });

            return {
                success: result.success,
                data: result.data,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Agent execution failed'
            };
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

// Singleton instance
let adkIntegrationService: ADKIntegrationService | null = null;

export function getADKIntegrationService(): ADKIntegrationService {
    if (!adkIntegrationService) {
        adkIntegrationService = new ADKIntegrationService();
    }
    return adkIntegrationService;
}

export async function initializeADKIntegration(): Promise<ADKIntegrationService> {
    const service = getADKIntegrationService();
    if (!service.isInitialized()) {
        await service.initialize();
    }
    return service;
}