// Enhanced SMART Goal Engine with ADK Agent Integration
import { SMARTGoal, GoalStatus, LifeDomain } from '../types';
import { getADKIntegrationService } from './ADKIntegrationService';
import { EnhancedSMARTGoalService } from './EnhancedSMARTGoalService';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
    adkAnalysis?: any;
    recommendations: string[];
}

export interface ProgressReport {
    goalId: string;
    currentProgress: number;
    progressRate: number;
    predictedCompletion: Date;
    milestoneProgress: {
        completed: number;
        total: number;
        nextMilestone?: Date;
    };
    insights: string[];
    riskFactors: string[];
}

export interface Adjustment {
    type: 'timeline' | 'metrics' | 'resources' | 'approach';
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    recommendation: string;
}

export class EnhancedSMARTGoalEngine {
    private adkService = getADKIntegrationService();
    private goalService = new EnhancedSMARTGoalService();

    /**
     * Validates a goal using ADK agent analysis
     */
    public async validateGoal(goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ValidationResult> {
        try {
            // Initialize ADK service if needed
            if (!this.adkService.isInitialized()) {
                await this.adkService.initialize();
            }

            // Use SMART Goal Agent for comprehensive validation
            const smartAnalysisResult = await this.adkService.executeAgentAction(
                'smart_goal',
                'system', // System user for validation
                'analyze_smart_criteria',
                {
                    goalDescription: goalData.description,
                    domain: this.inferDomainFromGoal(goalData),
                    title: goalData.title
                }
            );

            let adkAnalysis, score = 0, errors = [], warnings = [], recommendations = [];

            if (smartAnalysisResult.success) {
                adkAnalysis = smartAnalysisResult.data?.analysis;
                score = adkAnalysis?.overallScore * 100 || 0;
                recommendations = smartAnalysisResult.data?.recommendations || [];
            } else {
                errors.push(`ADK analysis failed: ${smartAnalysisResult.error}`);
            }

            // Perform traditional validation as fallback
            const traditionalValidation = this.performTraditionalValidation(goalData);
            errors.push(...traditionalValidation.errors);
            warnings.push(...traditionalValidation.warnings);

            // Combine scores if both available
            if (traditionalValidation.score > 0 && score === 0) {
                score = traditionalValidation.score;
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                score,
                adkAnalysis,
                recommendations
            };

        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
                score: 0,
                recommendations: ['Please review goal criteria and try again']
            };
        }
    }

    /**
     * Generates an action plan using ADK agent coordination
     */
    public async generateActionPlan(goal: SMARTGoal): Promise<any> {
        try {
            const domain = this.inferDomainFromGoal(goal);

            // Use domain-specific agent to generate action plan
            const domainPlanResult = await this.adkService.createDomainSpecificPlan(
                goal.userId,
                domain,
                {
                    goalId: goal.id,
                    goalDescription: goal.description,
                    smartCriteria: {
                        specific: goal.specific,
                        measurable: goal.measurable,
                        achievable: goal.achievable,
                        relevant: goal.relevant,
                        timeBound: goal.timeBound
                    }
                }
            );

            if (domainPlanResult.success) {
                return this.formatActionPlan(goal, domainPlanResult.plan);
            } else {
                // Fallback to traditional action plan generation
                return this.generateTraditionalActionPlan(goal);
            }

        } catch (error) {
            console.error('Action plan generation error:', error);
            return this.generateTraditionalActionPlan(goal);
        }
    }

    /**
     * Tracks progress using ADK analytics agent
     */
    public async trackProgress(goalId: string, goal: SMARTGoal): Promise<ProgressReport> {
        try {
            // Use analytics agent for comprehensive progress tracking
            const progressAnalysis = await this.goalService.analyzeGoalProgress(goal.userId, goalId);

            // Calculate milestone progress
            const milestoneProgress = this.calculateMilestoneProgress(goal);

            // Calculate progress rate
            const progressRate = this.calculateProgressRate(goal);

            return {
                goalId,
                currentProgress: progressAnalysis.currentProgress,
                progressRate,
                predictedCompletion: progressAnalysis.predictedCompletion,
                milestoneProgress,
                insights: progressAnalysis.insights,
                riskFactors: progressAnalysis.riskFactors
            };

        } catch (error) {
            console.error('Progress tracking error:', error);
            return this.generateFallbackProgressReport(goalId, goal);
        }
    }

    /**
     * Suggests adjustments using ADK agent insights
     */
    public async suggestAdjustments(goalId: string, goal: SMARTGoal, progressReport: ProgressReport): Promise<Adjustment[]> {
        try {
            const adjustments: Adjustment[] = [];

            // Use ADK agents to generate intelligent adjustments
            const adjustmentResult = await this.adkService.executeAgentAction(
                'smart_goal',
                goal.userId,
                'suggest_adjustments',
                {
                    goalId,
                    currentProgress: progressReport.currentProgress,
                    progressRate: progressReport.progressRate,
                    riskFactors: progressReport.riskFactors
                }
            );

            if (adjustmentResult.success && adjustmentResult.data?.adjustments) {
                adjustments.push(...adjustmentResult.data.adjustments);
            }

            // Add rule-based adjustments
            adjustments.push(...this.generateRuleBasedAdjustments(goal, progressReport));

            return adjustments;

        } catch (error) {
            console.error('Adjustment suggestion error:', error);
            return this.generateRuleBasedAdjustments(goal, progressReport);
        }
    }

    /**
     * Optimizes goal using multi-agent coordination
     */
    public async optimizeGoal(goalId: string, goal: SMARTGoal): Promise<{
        optimizedGoal: Partial<SMARTGoal>;
        optimizations: string[];
        confidence: number;
    }> {
        try {
            const domain = this.inferDomainFromGoal(goal);

            // Use master workflow agent for goal optimization
            const optimizationResult = await this.adkService.executeAgentAction(
                'coordination',
                goal.userId,
                'optimize_goal',
                {
                    goalId,
                    currentGoal: goal,
                    domain
                }
            );

            if (optimizationResult.success) {
                return {
                    optimizedGoal: optimizationResult.data?.optimizedGoal || {},
                    optimizations: optimizationResult.data?.optimizations || [],
                    confidence: optimizationResult.data?.confidence || 0.5
                };
            }

            // Fallback optimization
            return this.performBasicOptimization(goal);

        } catch (error) {
            console.error('Goal optimization error:', error);
            return this.performBasicOptimization(goal);
        }
    }

    // Helper methods
    private performTraditionalValidation(goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): {
        errors: string[];
        warnings: string[];
        score: number;
    } {
        const errors = [];
        const warnings = [];
        let score = 0;

        // Specific validation
        if (!goalData.specific || goalData.specific.length < 10) {
            errors.push('Goal needs to be more specific');
        } else {
            score += 20;
        }

        // Measurable validation
        if (!goalData.measurable || goalData.measurable.length === 0) {
            errors.push('Goal must have measurable metrics');
        } else {
            score += 20;
        }

        // Achievable validation
        if (!goalData.achievable) {
            warnings.push('Achievability assessment missing');
        } else {
            score += 20;
            if (goalData.achievable.difficultyLevel === 'difficult') {
                warnings.push('Goal may be too challenging');
            }
        }

        // Relevant validation
        if (!goalData.relevant || goalData.relevant.personalValues.length === 0) {
            warnings.push('Goal relevance could be better defined');
        } else {
            score += 20;
        }

        // Time-bound validation
        if (!goalData.timeBound || !goalData.timeBound.endDate) {
            errors.push('Goal must have a clear deadline');
        } else {
            score += 20;
            const now = new Date();
            if (goalData.timeBound.endDate <= now) {
                errors.push('Goal deadline must be in the future');
            }
        }

        return { errors, warnings, score };
    }

    private generateTraditionalActionPlan(goal: SMARTGoal): any {
        const milestones = goal.timeBound.milestones.map((date, index) => ({
            id: `milestone_${index + 1}`,
            title: `Milestone ${index + 1}`,
            description: `Progress checkpoint for ${goal.title}`,
            targetDate: date,
            completed: false
        }));

        const tasks = [
            {
                id: 'task_setup',
                title: 'Goal Setup',
                description: 'Set up tracking and initial resources',
                completed: false,
                priority: 'high' as const,
                estimatedHours: 2
            },
            {
                id: 'task_progress',
                title: 'Regular Progress Review',
                description: 'Weekly progress review and adjustment',
                completed: false,
                priority: 'medium' as const,
                estimatedHours: 1
            }
        ];

        return {
            goalId: goal.id,
            milestones,
            tasks,
            dependencies: [],
            estimatedDuration: goal.achievable.estimatedEffort,
            requiredResources: goal.achievable.requiredResources
        };
    }

    private formatActionPlan(goal: SMARTGoal, domainPlan: any): any {
        return {
            goalId: goal.id,
            milestones: domainPlan?.milestones || [],
            tasks: domainPlan?.tasks || [],
            dependencies: domainPlan?.dependencies || [],
            estimatedDuration: domainPlan?.estimatedDuration || goal.achievable.estimatedEffort,
            requiredResources: domainPlan?.requiredResources || goal.achievable.requiredResources
        };
    }

    private calculateMilestoneProgress(goal: SMARTGoal): {
        completed: number;
        total: number;
        nextMilestone?: Date;
    } {
        const milestones = goal.timeBound.milestones;
        const now = new Date();

        const completed = milestones.filter(date => date <= now).length;
        const nextMilestone = milestones.find(date => date > now);

        return {
            completed,
            total: milestones.length,
            nextMilestone
        };
    }

    private calculateProgressRate(goal: SMARTGoal): number {
        const now = new Date();
        const totalDuration = goal.timeBound.endDate.getTime() - goal.createdAt.getTime();
        const elapsed = now.getTime() - goal.createdAt.getTime();
        const timeProgress = elapsed / totalDuration;

        // Calculate actual progress from metrics
        const actualProgress = goal.measurable.reduce((sum, metric) => {
            return sum + (metric.currentValue / metric.targetValue);
        }, 0) / goal.measurable.length;

        // Progress rate is actual progress divided by time progress
        return timeProgress > 0 ? actualProgress / timeProgress : 0;
    }

    private generateFallbackProgressReport(goalId: string, goal: SMARTGoal): ProgressReport {
        const currentProgress = goal.measurable.reduce((sum, metric) => {
            return sum + (metric.currentValue / metric.targetValue) * 100;
        }, 0) / goal.measurable.length;

        const progressRate = this.calculateProgressRate(goal);
        const milestoneProgress = this.calculateMilestoneProgress(goal);

        return {
            goalId,
            currentProgress,
            progressRate,
            predictedCompletion: goal.timeBound.endDate,
            milestoneProgress,
            insights: ['Progress tracking available'],
            riskFactors: currentProgress < 25 ? ['Low progress rate'] : []
        };
    }

    private generateRuleBasedAdjustments(goal: SMARTGoal, progressReport: ProgressReport): Adjustment[] {
        const adjustments: Adjustment[] = [];

        // Timeline adjustments
        if (progressReport.progressRate < 0.5 && progressReport.currentProgress < 50) {
            adjustments.push({
                type: 'timeline',
                description: 'Consider extending the deadline',
                impact: 'medium',
                effort: 'low',
                recommendation: 'Extend deadline by 2-4 weeks to maintain realistic expectations'
            });
        }

        // Metrics adjustments
        if (progressReport.currentProgress === 0) {
            adjustments.push({
                type: 'metrics',
                description: 'Break down metrics into smaller, more achievable targets',
                impact: 'high',
                effort: 'medium',
                recommendation: 'Create weekly or daily sub-targets to track progress more effectively'
            });
        }

        // Resource adjustments
        if (progressReport.riskFactors.length > 2) {
            adjustments.push({
                type: 'resources',
                description: 'Additional resources may be needed',
                impact: 'high',
                effort: 'high',
                recommendation: 'Consider getting help, tools, or additional time allocation'
            });
        }

        return adjustments;
    }

    private performBasicOptimization(goal: SMARTGoal): {
        optimizedGoal: Partial<SMARTGoal>;
        optimizations: string[];
        confidence: number;
    } {
        const optimizations = [];
        const optimizedGoal: Partial<SMARTGoal> = {};

        // Optimize timeline if too aggressive
        const now = new Date();
        const timeRemaining = goal.timeBound.endDate.getTime() - now.getTime();
        const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);

        if (daysRemaining < 30 && goal.achievable.difficultyLevel === 'challenging') {
            const newEndDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // Add 60 days
            optimizedGoal.timeBound = {
                ...goal.timeBound,
                endDate: newEndDate
            };
            optimizations.push('Extended timeline for better achievability');
        }

        return {
            optimizedGoal,
            optimizations,
            confidence: 0.6
        };
    }

    private inferDomainFromGoal(goal: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | SMARTGoal): LifeDomain {
        const description = goal.description.toLowerCase();

        if (description.includes('fitness') || description.includes('exercise') || description.includes('workout')) {
            return LifeDomain.FITNESS;
        }
        if (description.includes('learn') || description.includes('study') || description.includes('skill')) {
            return LifeDomain.LEARNING;
        }
        if (description.includes('money') || description.includes('save') || description.includes('budget')) {
            return LifeDomain.FINANCE;
        }
        if (description.includes('health') || description.includes('medical')) {
            return LifeDomain.HEALTH;
        }
        if (description.includes('nutrition') || description.includes('diet') || description.includes('eat')) {
            return LifeDomain.NUTRITION;
        }
        if (description.includes('sleep') || description.includes('rest')) {
            return LifeDomain.SLEEP;
        }
        if (description.includes('habit') || description.includes('routine')) {
            return LifeDomain.HABITS;
        }
        if (description.includes('career') || description.includes('job') || description.includes('work')) {
            return LifeDomain.CAREER;
        }
        if (description.includes('social') || description.includes('friend') || description.includes('relationship')) {
            return LifeDomain.SOCIAL;
        }

        return LifeDomain.PROJECTS; // Default fallback
    }
}