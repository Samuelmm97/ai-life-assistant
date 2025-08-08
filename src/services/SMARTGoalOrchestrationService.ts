// SMART Goal Orchestration Service - Bridges traditional services with ADK agents
import { SMARTGoal, GoalStatus, LifeDomain } from '../types';
import { GoalService } from './GoalService';
import { EnhancedSMARTGoalService, EnhancedGoalCreationRequest } from './EnhancedSMARTGoalService';
import { EnhancedSMARTGoalEngine } from './EnhancedSMARTGoalEngine';
import { getADKIntegrationService } from './ADKIntegrationService';

export interface OrchestrationConfig {
    useADKAgents: boolean;
    fallbackToTraditional: boolean;
    enableMultiDomain: boolean;
    enableScheduleIntegration: boolean;
}

export interface GoalCreationOptions {
    domain?: LifeDomain;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    useADKAnalysis?: boolean;
    enableScheduling?: boolean;
    context?: string[];
}

export class SMARTGoalOrchestrationService {
    private traditionalGoalService = new GoalService();
    private enhancedGoalService = new EnhancedSMARTGoalService();
    private enhancedEngine = new EnhancedSMARTGoalEngine();
    private adkService = getADKIntegrationService();

    private config: OrchestrationConfig = {
        useADKAgents: true,
        fallbackToTraditional: true,
        enableMultiDomain: true,
        enableScheduleIntegration: true
    };

    constructor(config?: Partial<OrchestrationConfig>) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    /**
     * Creates a SMART goal using the best available method (ADK or traditional)
     */
    public async createGoal(
        userId: string,
        goalDescription: string,
        options: GoalCreationOptions = {}
    ): Promise<{
        goal: SMARTGoal;
        actionPlan: any;
        method: 'adk' | 'traditional';
        analysis?: any;
        validation: any;
    }> {
        try {
            // Determine if we should use ADK agents
            const useADK = this.shouldUseADK(options);

            if (useADK) {
                try {
                    return await this.createGoalWithADK(userId, goalDescription, options);
                } catch (error) {
                    console.warn('ADK goal creation failed, falling back to traditional:', error);

                    if (this.config.fallbackToTraditional) {
                        return await this.createGoalTraditional(userId, goalDescription, options);
                    } else {
                        throw error;
                    }
                }
            } else {
                return await this.createGoalTraditional(userId, goalDescription, options);
            }

        } catch (error) {
            throw new Error(`Goal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates a goal using orchestrated services
     */
    public async updateGoal(
        goalId: string,
        updates: Partial<SMARTGoal>,
        options: { useADK?: boolean; recalculateSchedule?: boolean } = {}
    ): Promise<{
        goal: SMARTGoal;
        method: 'adk' | 'traditional';
        adkUpdates?: any;
    }> {
        try {
            const useADK = options.useADK ?? this.config.useADKAgents;

            if (useADK && this.adkService.isInitialized()) {
                const result = await this.enhancedGoalService.updateGoalWithADK(
                    goalId,
                    updates,
                    options.recalculateSchedule
                );

                return {
                    goal: result.goal,
                    method: 'adk',
                    adkUpdates: result.adkUpdates
                };
            } else {
                const goal = await this.traditionalGoalService.updateGoal(goalId, updates);
                if (!goal) {
                    throw new Error('Goal not found');
                }

                return {
                    goal,
                    method: 'traditional'
                };
            }

        } catch (error) {
            throw new Error(`Goal update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets goal progress using the best available analysis
     */
    public async getGoalProgress(goalId: string): Promise<{
        progress: any;
        method: 'adk' | 'traditional';
        insights?: string[];
        recommendations?: string[];
    }> {
        try {
            const goal = await this.traditionalGoalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            if (this.config.useADKAgents && this.adkService.isInitialized()) {
                try {
                    const adkProgress = await this.enhancedGoalService.analyzeGoalProgress(goal.userId, goalId);

                    return {
                        progress: adkProgress,
                        method: 'adk',
                        insights: adkProgress.insights,
                        recommendations: adkProgress.recommendations
                    };
                } catch (error) {
                    console.warn('ADK progress analysis failed, falling back:', error);
                }
            }

            // Fallback to traditional progress tracking
            const traditionalProgress = await this.traditionalGoalService.getGoalProgress(goalId);

            return {
                progress: traditionalProgress,
                method: 'traditional'
            };

        } catch (error) {
            throw new Error(`Progress tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets dashboard data using orchestrated services
     */
    public async getDashboardData(userId: string): Promise<{
        data: any;
        method: 'adk' | 'traditional';
        systemHealth?: any;
    }> {
        try {
            if (this.config.useADKAgents && this.adkService.isInitialized()) {
                try {
                    const enhancedData = await this.enhancedGoalService.getEnhancedDashboardData(userId);

                    return {
                        data: enhancedData,
                        method: 'adk',
                        systemHealth: enhancedData.systemHealth
                    };
                } catch (error) {
                    console.warn('ADK dashboard failed, falling back:', error);
                }
            }

            // Fallback to traditional dashboard
            const traditionalData = await this.traditionalGoalService.getDashboardData(userId);

            return {
                data: traditionalData,
                method: 'traditional'
            };

        } catch (error) {
            throw new Error(`Dashboard data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validates a goal using the best available method
     */
    public async validateGoal(goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{
        validation: any;
        method: 'adk' | 'traditional';
    }> {
        try {
            if (this.config.useADKAgents && this.adkService.isInitialized()) {
                try {
                    const adkValidation = await this.enhancedEngine.validateGoal(goalData);

                    return {
                        validation: adkValidation,
                        method: 'adk'
                    };
                } catch (error) {
                    console.warn('ADK validation failed, falling back:', error);
                }
            }

            // Fallback to traditional validation
            const traditionalValidation = await this.traditionalGoalService.validateGoal(goalData);

            return {
                validation: traditionalValidation,
                method: 'traditional'
            };

        } catch (error) {
            throw new Error(`Goal validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Creates multi-domain goals using ADK coordination
     */
    public async createMultiDomainGoal(
        userId: string,
        goalDescription: string,
        domains: LifeDomain[],
        priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    ): Promise<{
        result: any;
        method: 'adk' | 'traditional';
        conflicts?: string[];
    }> {
        try {
            if (!this.config.enableMultiDomain) {
                throw new Error('Multi-domain goals are disabled');
            }

            if (this.config.useADKAgents && this.adkService.isInitialized()) {
                const result = await this.enhancedGoalService.createMultiDomainGoal(
                    userId,
                    goalDescription,
                    domains,
                    priority
                );

                return {
                    result,
                    method: 'adk',
                    conflicts: result.conflicts
                };
            } else {
                // Traditional approach: create separate goals for each domain
                const goals = [];
                for (const domain of domains) {
                    const goal = await this.createGoal(userId, goalDescription, { domain, priority });
                    goals.push(goal);
                }

                return {
                    result: { goals },
                    method: 'traditional'
                };
            }

        } catch (error) {
            throw new Error(`Multi-domain goal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets system status and capabilities
     */
    public async getSystemStatus(): Promise<{
        adkAvailable: boolean;
        adkInitialized: boolean;
        capabilities: string[];
        config: OrchestrationConfig;
        systemHealth?: any;
    }> {
        const adkAvailable = !!this.adkService;
        const adkInitialized = adkAvailable && this.adkService.isInitialized();

        const capabilities = ['traditional_goals'];
        if (adkInitialized) {
            capabilities.push('adk_agents', 'smart_analysis', 'domain_planning');

            if (this.config.enableMultiDomain) {
                capabilities.push('multi_domain_coordination');
            }

            if (this.config.enableScheduleIntegration) {
                capabilities.push('schedule_integration');
            }
        }

        let systemHealth;
        if (adkInitialized) {
            try {
                systemHealth = await this.adkService.getSystemHealth();
            } catch (error) {
                console.warn('Failed to get system health:', error);
            }
        }

        return {
            adkAvailable,
            adkInitialized,
            capabilities,
            config: this.config,
            systemHealth
        };
    }

    /**
     * Updates orchestration configuration
     */
    public updateConfig(newConfig: Partial<OrchestrationConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // Private helper methods
    private shouldUseADK(options: GoalCreationOptions): boolean {
        // Use ADK if explicitly requested or if it's the default and available
        if (options.useADKAnalysis !== undefined) {
            return options.useADKAnalysis;
        }

        return this.config.useADKAgents && this.adkService.isInitialized();
    }

    private async createGoalWithADK(
        userId: string,
        goalDescription: string,
        options: GoalCreationOptions
    ): Promise<{
        goal: SMARTGoal;
        actionPlan: any;
        method: 'adk';
        analysis: any;
        validation: any;
    }> {
        const request: EnhancedGoalCreationRequest = {
            userId,
            goalDescription,
            domain: options.domain || this.inferDomainFromDescription(goalDescription),
            priority: options.priority || 'medium',
            context: options.context
        };

        const result = await this.enhancedGoalService.createEnhancedGoal(request);

        return {
            goal: result.goal,
            actionPlan: result.actionPlan,
            method: 'adk',
            analysis: result.adkAnalysis,
            validation: result.validation
        };
    }

    private async createGoalTraditional(
        userId: string,
        goalDescription: string,
        options: GoalCreationOptions
    ): Promise<{
        goal: SMARTGoal;
        actionPlan: any;
        method: 'traditional';
        validation: any;
    }> {
        // Create a basic goal structure for traditional service
        const goalData = {
            userId,
            title: goalDescription.substring(0, 100), // Truncate for title
            description: goalDescription,
            specific: goalDescription,
            measurable: [{
                name: 'Progress',
                unit: 'percent',
                targetValue: 100,
                currentValue: 0
            }],
            achievable: {
                difficultyLevel: 'moderate' as const,
                requiredResources: ['Time', 'Effort'],
                estimatedEffort: { hours: 20, days: 30, weeks: 4 }
            },
            relevant: {
                personalValues: ['Growth', 'Achievement'],
                lifeAreas: [options.domain || this.inferDomainFromDescription(goalDescription)],
                motivation: 'Personal development and goal achievement'
            },
            timeBound: {
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                milestones: []
            },
            status: GoalStatus.ACTIVE
        };

        const goal = await this.traditionalGoalService.createGoalFromData(goalData);

        return {
            goal: goal,
            actionPlan: null, // TODO: Generate action plan
            method: 'traditional',
            validation: { isValid: true, errors: [], warnings: [], suggestions: [] }
        };
    }

    private inferDomainFromDescription(description: string): LifeDomain {
        const lowerDesc = description.toLowerCase();

        if (lowerDesc.includes('fitness') || lowerDesc.includes('exercise') || lowerDesc.includes('workout')) {
            return LifeDomain.FITNESS;
        }
        if (lowerDesc.includes('learn') || lowerDesc.includes('study') || lowerDesc.includes('skill')) {
            return LifeDomain.LEARNING;
        }
        if (lowerDesc.includes('money') || lowerDesc.includes('save') || lowerDesc.includes('budget')) {
            return LifeDomain.FINANCE;
        }
        if (lowerDesc.includes('health') || lowerDesc.includes('medical')) {
            return LifeDomain.HEALTH;
        }
        if (lowerDesc.includes('nutrition') || lowerDesc.includes('diet') || lowerDesc.includes('eat')) {
            return LifeDomain.NUTRITION;
        }
        if (lowerDesc.includes('sleep') || lowerDesc.includes('rest')) {
            return LifeDomain.SLEEP;
        }
        if (lowerDesc.includes('habit') || lowerDesc.includes('routine')) {
            return LifeDomain.HABITS;
        }
        if (lowerDesc.includes('career') || lowerDesc.includes('job') || lowerDesc.includes('work')) {
            return LifeDomain.CAREER;
        }
        if (lowerDesc.includes('social') || lowerDesc.includes('friend') || lowerDesc.includes('relationship')) {
            return LifeDomain.SOCIAL;
        }

        return LifeDomain.PROJECTS; // Default fallback
    }
}