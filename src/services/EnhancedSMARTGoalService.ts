// Enhanced SMART Goal Service with ADK Agent Integration
import { database } from '../database';
import { SMARTGoal, GoalStatus, LifeDomain, ActionPlan } from '../types';
import { TimeframeFlexibility } from '../types/ai-goal-planning';
import { getADKIntegrationService } from './ADKIntegrationService';
import { SMARTCriteriaGeneratorService } from './SMARTCriteriaGenerator';
import { NaturalLanguageProcessorService } from './NaturalLanguageProcessor';

export interface EnhancedGoalCreationRequest {
    userId: string;
    goalDescription: string;
    domain: LifeDomain;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timeframe?: {
        start?: Date;
        end?: Date;
        duration?: string;
    };
    context?: string[];
}

export interface EnhancedGoalCreationResult {
    goal: SMARTGoal;
    actionPlan: ActionPlan;
    adkAnalysis: {
        smartAnalysis: any;
        domainPlan?: any;
        schedule?: any;
        confidence: number;
        recommendations: string[];
    };
    validation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        score: number;
    };
}

export interface GoalProgressAnalysis {
    currentProgress: number;
    predictedCompletion: Date;
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
    adjustmentSuggestions: string[];
}

export class EnhancedSMARTGoalService {
    private adkService = getADKIntegrationService();
    private criteriaGenerator = new SMARTCriteriaGeneratorService();
    private nlpProcessor = new NaturalLanguageProcessorService();

    /**
     * Creates a SMART goal using ADK agent orchestration
     */
    public async createEnhancedGoal(request: EnhancedGoalCreationRequest): Promise<EnhancedGoalCreationResult> {
        try {
            // Initialize ADK service if needed
            if (!this.adkService.isInitialized()) {
                await this.adkService.initialize();
            }

            // Step 1: Process natural language goal description
            const nlpResult = await this.nlpProcessor.extractIntent(request.goalDescription);

            // Step 2: Use ADK agents for comprehensive SMART analysis
            const adkResult = await this.adkService.createSMARTGoalWithAI(
                request.userId,
                request.goalDescription,
                request.domain
            );

            if (!adkResult.success) {
                throw new Error(`ADK goal creation failed: ${adkResult.error}`);
            }

            // Step 3: Generate SMART criteria using enhanced service
            const smartCriteria = await this.generateEnhancedSMARTCriteria(nlpResult, request);

            // Step 4: Create goal with enhanced data
            const goalData = {
                title: nlpResult.outcome || request.goalDescription,
                description: request.goalDescription,
                specific: smartCriteria.specific,
                measurable: smartCriteria.measurable,
                achievable: smartCriteria.achievable,
                relevant: smartCriteria.relevant,
                timeBound: smartCriteria.timeBound,
                status: GoalStatus.ACTIVE
            };

            // Step 5: Create goal in database
            const goal = database.createGoal({
                ...goalData,
                userId: request.userId
            });

            // Step 6: Generate action plan using ADK insights
            const actionPlanData = await this.generateEnhancedActionPlan(
                goal.toJSON(),
                adkResult.domainPlan,
                smartCriteria
            );
            const actionPlan = database.createActionPlan(actionPlanData);

            // Step 7: Integrate with calendar using scheduler agent
            await this.adkService.integrateGoalSchedule(request.userId, goal.id);

            return {
                goal: goal.toJSON(),
                actionPlan: actionPlan.toJSON(),
                adkAnalysis: {
                    smartAnalysis: adkResult.smartAnalysis,
                    domainPlan: adkResult.domainPlan,
                    schedule: adkResult.schedule,
                    confidence: this.calculateConfidenceScore(adkResult),
                    recommendations: this.extractRecommendations(adkResult)
                },
                validation: {
                    isValid: true,
                    errors: [],
                    warnings: this.generateWarnings(smartCriteria),
                    score: this.calculateSMARTScore(smartCriteria)
                }
            };

        } catch (error) {
            throw new Error(`Enhanced goal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Analyzes goal progress using ADK analytics agent
     */
    public async analyzeGoalProgress(userId: string, goalId: string): Promise<GoalProgressAnalysis> {
        try {
            // Get current goal data
            const goal = database.getGoalById(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Use ADK analytics agent for comprehensive progress analysis
            const progressResult = await this.adkService.trackGoalProgress(userId, goalId);

            if (!progressResult.success) {
                throw new Error(`Progress analysis failed: ${progressResult.error}`);
            }

            // Calculate current progress from metrics
            const currentProgress = this.calculateCurrentProgress(goal.toJSON());

            // Generate predictive insights
            const predictedCompletion = this.predictCompletionDate(goal.toJSON(), currentProgress);

            return {
                currentProgress,
                predictedCompletion,
                insights: progressResult.insights || [],
                recommendations: progressResult.recommendations || [],
                riskFactors: this.identifyRiskFactors(goal.toJSON(), currentProgress),
                adjustmentSuggestions: this.generateAdjustmentSuggestions(goal.toJSON(), progressResult.analysis)
            };

        } catch (error) {
            throw new Error(`Progress analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates goal using ADK agent coordination
     */
    public async updateGoalWithADK(
        goalId: string,
        updates: Partial<SMARTGoal>,
        recalculateSchedule: boolean = true
    ): Promise<{
        goal: SMARTGoal;
        adkUpdates?: any;
        scheduleUpdates?: any;
    }> {
        try {
            const goal = database.getGoalById(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Update goal in database
            const updatedGoal = database.updateGoal(goalId, updates);
            if (!updatedGoal) {
                throw new Error('Goal update failed');
            }

            let adkUpdates, scheduleUpdates;

            // If significant changes, re-coordinate with ADK agents
            if (this.requiresADKRecoordination(updates)) {
                const domain = this.inferDomainFromGoal(updatedGoal.toJSON());
                adkUpdates = await this.adkService.createDomainSpecificPlan(
                    updatedGoal.userId,
                    domain,
                    { goalId, updates }
                );
            }

            // Update schedule if requested
            if (recalculateSchedule) {
                scheduleUpdates = await this.adkService.integrateGoalSchedule(
                    updatedGoal.userId,
                    goalId
                );
            }

            return {
                goal: updatedGoal.toJSON(),
                adkUpdates,
                scheduleUpdates
            };

        } catch (error) {
            throw new Error(`Goal update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Coordinates multi-domain goals using ADK orchestration
     */
    public async createMultiDomainGoal(
        userId: string,
        goalDescription: string,
        domains: LifeDomain[],
        priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    ): Promise<{
        primaryGoal: SMARTGoal;
        domainPlans: Record<string, any>;
        coordination: any;
        conflicts?: string[];
    }> {
        try {
            // Use ADK master workflow agent for multi-domain coordination
            const coordinationResult = await this.adkService.coordinateMultiDomainGoal(
                userId,
                domains,
                {
                    goalDescription,
                    priority,
                    timeframe: {
                        start: new Date(),
                        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days default
                    }
                }
            );

            if (!coordinationResult.success) {
                throw new Error(`Multi-domain coordination failed: ${coordinationResult.error}`);
            }

            // Create primary goal with coordination insights
            const primaryDomain = domains[0];
            const primaryGoalRequest: EnhancedGoalCreationRequest = {
                userId,
                goalDescription,
                domain: primaryDomain,
                priority,
                context: [`Multi-domain goal spanning: ${domains.join(', ')}`]
            };

            const primaryGoalResult = await this.createEnhancedGoal(primaryGoalRequest);

            // Create domain-specific plans for other domains
            const domainPlans: Record<string, any> = {};
            for (const domain of domains.slice(1)) {
                const domainPlan = await this.adkService.createDomainSpecificPlan(
                    userId,
                    domain,
                    {
                        primaryGoalId: primaryGoalResult.goal.id,
                        goalDescription,
                        priority
                    }
                );
                domainPlans[domain] = domainPlan;
            }

            return {
                primaryGoal: primaryGoalResult.goal,
                domainPlans,
                coordination: coordinationResult.coordination,
                conflicts: coordinationResult.conflicts
            };

        } catch (error) {
            throw new Error(`Multi-domain goal creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets comprehensive dashboard data using ADK analytics
     */
    public async getEnhancedDashboardData(userId: string): Promise<{
        goals: SMARTGoal[];
        analytics: any;
        insights: string[];
        recommendations: string[];
        systemHealth: any;
    }> {
        try {
            // Get basic goal data
            const goals = await this.getUserGoals(userId);

            // Get ADK system health
            const systemHealth = await this.adkService.getSystemHealth();

            // Analyze overall progress using analytics agent
            let analytics, insights = [], recommendations = [];

            if (systemHealth.initialized && goals.length > 0) {
                // Use analytics agent for comprehensive analysis
                const analyticsResult = await this.adkService.executeAgentAction(
                    'analytics',
                    userId,
                    'analyze_user_progress',
                    { goalIds: goals.map(g => g.id) }
                );

                if (analyticsResult.success) {
                    analytics = analyticsResult.data?.analysis;
                    insights = analyticsResult.data?.insights || [];
                    recommendations = analyticsResult.data?.recommendations || [];
                }
            }

            return {
                goals,
                analytics,
                insights,
                recommendations,
                systemHealth
            };

        } catch (error) {
            throw new Error(`Dashboard data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Helper methods
    private async generateEnhancedSMARTCriteria(nlpResult: any, request: EnhancedGoalCreationRequest) {
        const goalIntent = {
            action: nlpResult.extractedAction || 'achieve',
            outcome: nlpResult.extractedOutcome || request.goalDescription,
            domain: request.domain,
            urgency: nlpResult.urgency || 'medium',
            context: request.context || []
        };

        const timeframeInfo = {
            startDate: request.timeframe?.start || null,
            endDate: request.timeframe?.end || null,
            duration: request.timeframe?.duration ? { hours: 0 } : null,
            milestones: [],
            flexibility: TimeframeFlexibility.FLEXIBLE,
            extractedPhrases: []
        };

        const [specific, measurable, achievable, relevant, timeBound] = await Promise.all([
            this.criteriaGenerator.generateSpecific(goalIntent),
            this.criteriaGenerator.generateMeasurable(goalIntent, request.goalDescription),
            this.criteriaGenerator.generateAchievable(goalIntent, timeframeInfo),
            this.criteriaGenerator.generateRelevant(goalIntent, request.userId),
            this.criteriaGenerator.generateTimeBound(timeframeInfo, goalIntent)
        ]);

        return {
            specific: specific.content,
            measurable: measurable.content,
            achievable: achievable.content,
            relevant: relevant.content,
            timeBound: timeBound.content
        };
    }

    private async generateEnhancedActionPlan(goal: SMARTGoal, domainPlan: any, smartCriteria: any) {
        // Generate action plan with ADK insights
        const milestones = smartCriteria.timeBound.milestones.map((date: Date, index: number) => ({
            id: `milestone_${index + 1}`,
            title: `Milestone ${index + 1}`,
            description: `Progress checkpoint for ${goal.title}`,
            targetDate: date,
            completed: false
        }));

        const tasks = this.generateTasksFromDomainPlan(domainPlan, goal);

        return {
            goalId: goal.id,
            milestones,
            tasks,
            dependencies: [],
            estimatedDuration: smartCriteria.achievable.estimatedEffort,
            requiredResources: smartCriteria.achievable.requiredResources
        };
    }

    private generateTasksFromDomainPlan(domainPlan: any, goal: SMARTGoal) {
        // Generate tasks based on domain plan or default tasks
        const defaultTasks = [
            {
                id: 'task_1',
                title: 'Initial Setup',
                description: `Set up resources and environment for ${goal.title}`,
                completed: false,
                priority: 'high' as const,
                estimatedHours: 2
            },
            {
                id: 'task_2',
                title: 'Progress Tracking Setup',
                description: 'Establish metrics and tracking systems',
                completed: false,
                priority: 'medium' as const,
                estimatedHours: 1
            },
            {
                id: 'task_3',
                title: 'Regular Review',
                description: 'Schedule regular progress reviews',
                completed: false,
                priority: 'medium' as const,
                estimatedHours: 0.5
            }
        ];

        return domainPlan?.tasks || defaultTasks;
    }

    private calculateConfidenceScore(adkResult: any): number {
        // Calculate confidence based on ADK analysis quality
        let score = 0.5; // Base score

        if (adkResult.smartAnalysis) score += 0.2;
        if (adkResult.domainPlan) score += 0.2;
        if (adkResult.schedule) score += 0.1;

        return Math.min(score, 1.0);
    }

    private extractRecommendations(adkResult: any): string[] {
        const recommendations = [];

        if (adkResult.smartAnalysis?.recommendations) {
            recommendations.push(...adkResult.smartAnalysis.recommendations);
        }

        if (adkResult.domainPlan?.recommendations) {
            recommendations.push(...adkResult.domainPlan.recommendations);
        }

        return recommendations;
    }

    private generateWarnings(smartCriteria: any): string[] {
        const warnings = [];

        if (smartCriteria.achievable.difficultyLevel === 'difficult') {
            warnings.push('This goal has been assessed as difficult - consider breaking it into smaller goals');
        }

        if (smartCriteria.measurable.length === 0) {
            warnings.push('No clear metrics identified - progress tracking may be challenging');
        }

        return warnings;
    }

    private calculateSMARTScore(smartCriteria: any): number {
        let score = 0;
        let maxScore = 5;

        // Specific score
        if (smartCriteria.specific && smartCriteria.specific.length > 10) score += 1;

        // Measurable score
        if (smartCriteria.measurable && smartCriteria.measurable.length > 0) score += 1;

        // Achievable score
        if (smartCriteria.achievable && smartCriteria.achievable.difficultyLevel !== 'difficult') score += 1;

        // Relevant score
        if (smartCriteria.relevant && smartCriteria.relevant.personalValues.length > 0) score += 1;

        // Time-bound score
        if (smartCriteria.timeBound && smartCriteria.timeBound.endDate) score += 1;

        return (score / maxScore) * 100;
    }

    private calculateCurrentProgress(goal: SMARTGoal): number {
        if (!goal.measurable || goal.measurable.length === 0) return 0;

        const totalProgress = goal.measurable.reduce((sum, metric) => {
            const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
            return sum + Math.min(progress, 100);
        }, 0);

        return totalProgress / goal.measurable.length;
    }

    private predictCompletionDate(goal: SMARTGoal, currentProgress: number): Date {
        const now = new Date();
        const endDate = new Date(goal.timeBound.endDate);

        if (currentProgress === 0) return endDate;

        const totalDuration = endDate.getTime() - goal.createdAt.getTime();
        const progressRate = currentProgress / (now.getTime() - goal.createdAt.getTime());
        const remainingProgress = 100 - currentProgress;
        const estimatedRemainingTime = remainingProgress / progressRate;

        return new Date(now.getTime() + estimatedRemainingTime);
    }

    private identifyRiskFactors(goal: SMARTGoal, currentProgress: number): string[] {
        const risks = [];
        const now = new Date();
        const endDate = new Date(goal.timeBound.endDate);
        const timeRemaining = endDate.getTime() - now.getTime();
        const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);

        if (currentProgress < 25 && daysRemaining < 30) {
            risks.push('Low progress with limited time remaining');
        }

        if (currentProgress === 0 && daysRemaining < 60) {
            risks.push('No progress recorded - goal may be at risk');
        }

        if (goal.status === GoalStatus.PAUSED) {
            risks.push('Goal is currently paused');
        }

        return risks;
    }

    private generateAdjustmentSuggestions(goal: SMARTGoal, analysis: any): string[] {
        const suggestions = [];

        if (analysis?.progressRate && analysis.progressRate < 0.5) {
            suggestions.push('Consider increasing daily effort or time allocation');
        }

        if (analysis?.obstacles && analysis.obstacles.length > 0) {
            suggestions.push('Address identified obstacles to improve progress');
        }

        suggestions.push('Review and update action plan based on current progress');
        suggestions.push('Consider adjusting timeline if needed');

        return suggestions;
    }

    private requiresADKRecoordination(updates: Partial<SMARTGoal>): boolean {
        // Check if updates require re-coordination with ADK agents
        return !!(updates.timeBound || updates.measurable || updates.achievable);
    }

    private inferDomainFromGoal(goal: SMARTGoal): LifeDomain {
        // Simple domain inference - in practice this would be more sophisticated
        const description = goal.description.toLowerCase();

        if (description.includes('fitness') || description.includes('exercise')) return LifeDomain.FITNESS;
        if (description.includes('learn') || description.includes('study')) return LifeDomain.LEARNING;
        if (description.includes('money') || description.includes('save')) return LifeDomain.FINANCE;
        if (description.includes('health')) return LifeDomain.HEALTH;

        return LifeDomain.PROJECTS; // Default
    }

    // Delegate to existing methods for compatibility
    private async getUserGoals(userId: string): Promise<SMARTGoal[]> {
        const goals = database.getGoalsByUserId(userId);
        return goals.map(goal => goal.toJSON());
    }
}