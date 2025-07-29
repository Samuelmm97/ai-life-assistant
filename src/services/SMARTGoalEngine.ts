import { SMARTGoal, GoalStatus, MeasurableMetric, AchievabilityAssessment, RelevanceContext, TimeConstraint } from '../types';
import { ActionPlan, Task, Milestone, Resource } from '../models/ActionPlan';
import { Priority, Duration } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}

export interface GoalInput {
    title: string;
    description: string;
    specific: string;
    measurable: MeasurableMetric[];
    achievable: AchievabilityAssessment;
    relevant: RelevanceContext;
    timeBound: TimeConstraint;
}

export interface ProgressReport {
    goalId: string;
    overallProgress: number;
    metricProgress: { [metricName: string]: number };
    timeProgress: number;
    status: GoalStatus;
    daysRemaining: number;
    isOnTrack: boolean;
    recommendations: string[];
}

export interface Adjustment {
    type: 'timeline' | 'metrics' | 'resources' | 'approach';
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
}

export class SMARTGoalEngine {
    /**
     * Validates a SMART goal against the SMART criteria
     */
    public validateGoal(goal: GoalInput): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Validate Specific
        if (!goal.specific || goal.specific.trim().length < 10) {
            errors.push('Specific criteria: Goal description must be at least 10 characters and clearly define what you want to achieve');
        }

        // Validate Measurable
        if (!goal.measurable || goal.measurable.length === 0) {
            errors.push('Measurable criteria: At least one measurable metric is required');
        } else {
            goal.measurable.forEach((metric, index) => {
                if (!metric.name || !metric.unit) {
                    errors.push(`Measurable criteria: Metric ${index + 1} must have a name and unit`);
                }
                if (metric.targetValue <= 0) {
                    errors.push(`Measurable criteria: Metric "${metric.name}" must have a positive target value`);
                }
                if (metric.currentValue < 0) {
                    errors.push(`Measurable criteria: Metric "${metric.name}" current value cannot be negative`);
                }
            });
        }

        // Validate Achievable
        if (!goal.achievable.estimatedEffort || goal.achievable.estimatedEffort.hours <= 0) {
            errors.push('Achievable criteria: Estimated effort in hours must be greater than 0');
        }

        if (goal.achievable.estimatedEffort.hours > 1000) {
            warnings.push('Achievable criteria: Goal requires over 1000 hours - consider breaking into smaller goals');
        }

        if (!goal.achievable.requiredResources || goal.achievable.requiredResources.length === 0) {
            warnings.push('Achievable criteria: Consider listing required resources to better plan your goal');
        }

        // Validate Relevant
        if (!goal.relevant.motivation || goal.relevant.motivation.trim().length < 10) {
            warnings.push('Relevant criteria: A clear motivation helps maintain focus and commitment');
        }

        if (!goal.relevant.lifeAreas || goal.relevant.lifeAreas.length === 0) {
            suggestions.push('Relevant criteria: Consider selecting life areas this goal impacts for better integration');
        }

        // Validate Time-bound
        const startDate = new Date(goal.timeBound.startDate);
        const endDate = new Date(goal.timeBound.endDate);
        const today = new Date();

        if (startDate >= endDate) {
            errors.push('Time-bound criteria: End date must be after start date');
        }

        if (endDate <= today) {
            errors.push('Time-bound criteria: End date must be in the future');
        }

        const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedDays = goal.achievable.estimatedEffort.weeks ? goal.achievable.estimatedEffort.weeks * 7 :
            Math.ceil(goal.achievable.estimatedEffort.hours / 8); // Assuming 8 hours per day

        if (daysDifference < estimatedDays * 0.5) {
            warnings.push('Time-bound criteria: Timeline might be too aggressive for the estimated effort required');
        }

        if (daysDifference > estimatedDays * 3) {
            suggestions.push('Time-bound criteria: Consider setting intermediate milestones for this long-term goal');
        }

        // Additional suggestions
        if (goal.title && goal.title.length > 50) {
            suggestions.push('Consider shortening the goal title for better clarity');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Generates a basic action plan for a SMART goal
     */
    public async generateActionPlan(goal: SMARTGoal): Promise<Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'>> {
        const milestones = this.generateMilestones(goal);
        const tasks = this.generateTasks(goal, milestones);
        const resources = this.generateResources(goal);

        return {
            goalId: goal.id,
            userId: goal.userId,
            milestones,
            tasks,
            dependencies: [], // Simple implementation - no complex dependencies for MVP
            estimatedDuration: goal.achievable.estimatedEffort,
            requiredResources: resources
        };
    }

    /**
     * Tracks progress for a goal and provides insights
     */
    public async trackProgress(goalId: string, goal: SMARTGoal): Promise<ProgressReport> {
        const overallProgress = this.calculateOverallProgress(goal);
        const metricProgress = this.calculateMetricProgress(goal);
        const timeProgress = this.calculateTimeProgress(goal);
        const daysRemaining = this.getDaysRemaining(goal.timeBound.endDate);
        const isOnTrack = this.isGoalOnTrack(overallProgress, timeProgress);
        const recommendations = this.generateProgressRecommendations(goal, overallProgress, timeProgress, isOnTrack);

        return {
            goalId,
            overallProgress,
            metricProgress,
            timeProgress,
            status: goal.status,
            daysRemaining,
            isOnTrack,
            recommendations
        };
    }

    /**
     * Suggests adjustments based on goal progress
     */
    public async suggestAdjustments(goalId: string, goal: SMARTGoal, progressData: ProgressReport): Promise<Adjustment[]> {
        const adjustments: Adjustment[] = [];

        // Timeline adjustments
        if (!progressData.isOnTrack && progressData.timeProgress > progressData.overallProgress + 20) {
            adjustments.push({
                type: 'timeline',
                description: 'Goal is behind schedule',
                impact: 'high',
                recommendation: 'Consider extending the deadline or reducing scope to maintain achievability'
            });
        }

        // Metric adjustments
        const lowPerformingMetrics = Object.entries(progressData.metricProgress)
            .filter(([_, progress]) => progress < 25)
            .map(([name, _]) => name);

        if (lowPerformingMetrics.length > 0) {
            adjustments.push({
                type: 'metrics',
                description: `Low progress on metrics: ${lowPerformingMetrics.join(', ')}`,
                impact: 'medium',
                recommendation: 'Focus on these specific metrics or consider if they are still relevant to your goal'
            });
        }

        // Resource adjustments
        if (goal.achievable.difficultyLevel === 'difficult' && progressData.overallProgress < 20) {
            adjustments.push({
                type: 'resources',
                description: 'Difficult goal with low progress',
                impact: 'high',
                recommendation: 'Consider allocating more time or seeking additional resources/support'
            });
        }

        // Approach adjustments
        if (progressData.overallProgress === 0 && progressData.timeProgress > 25) {
            adjustments.push({
                type: 'approach',
                description: 'No progress made despite time passing',
                impact: 'high',
                recommendation: 'Review your approach and consider breaking the goal into smaller, more manageable tasks'
            });
        }

        return adjustments;
    }

    // Private helper methods

    private generateMilestones(goal: SMARTGoal): Milestone[] {
        const milestones: Milestone[] = [];
        const startDate = new Date(goal.timeBound.startDate);
        const endDate = new Date(goal.timeBound.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Generate milestones at 25%, 50%, 75% completion
        const milestonePercentages = [0.25, 0.5, 0.75];

        milestonePercentages.forEach((percentage, index) => {
            const milestoneDate = new Date(startDate.getTime() + (totalDays * percentage * 24 * 60 * 60 * 1000));

            milestones.push({
                id: uuidv4(),
                title: `${Math.round(percentage * 100)}% Milestone`,
                description: `Achieve ${Math.round(percentage * 100)}% progress towards: ${goal.title}`,
                dueDate: milestoneDate,
                completed: false
            });
        });

        return milestones;
    }

    private generateTasks(goal: SMARTGoal, milestones: Milestone[]): Task[] {
        const tasks: Task[] = [];

        // Generate initial setup task
        tasks.push({
            id: uuidv4(),
            title: 'Goal Setup and Planning',
            description: `Set up resources and create detailed plan for: ${goal.title}`,
            priority: Priority.HIGH,
            estimatedDuration: { hours: 2 },
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            completed: false,
            dependencies: []
        });

        // Generate tasks for each measurable metric
        goal.measurable.forEach((metric, index) => {
            tasks.push({
                id: uuidv4(),
                title: `Work on ${metric.name}`,
                description: `Make progress towards ${metric.targetValue} ${metric.unit} for ${metric.name}`,
                priority: Priority.MEDIUM,
                estimatedDuration: {
                    hours: Math.ceil(goal.achievable.estimatedEffort.hours / goal.measurable.length)
                },
                dueDate: milestones[Math.min(index, milestones.length - 1)]?.dueDate || goal.timeBound.endDate,
                completed: false,
                dependencies: index === 0 ? [tasks[0].id] : []
            });
        });

        // Generate review and adjustment task
        tasks.push({
            id: uuidv4(),
            title: 'Progress Review and Adjustment',
            description: 'Review progress and adjust approach if needed',
            priority: Priority.MEDIUM,
            estimatedDuration: { hours: 1 },
            dueDate: milestones[0]?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            completed: false,
            dependencies: []
        });

        return tasks;
    }

    private generateResources(goal: SMARTGoal): Resource[] {
        const resources: Resource[] = [];

        // Add time resource
        resources.push({
            id: uuidv4(),
            name: 'Time Investment',
            type: 'time',
            amount: goal.achievable.estimatedEffort.hours,
            unit: 'hours',
            available: true
        });

        // Add resources from achievable criteria
        goal.achievable.requiredResources.forEach((resourceName, index) => {
            resources.push({
                id: uuidv4(),
                name: resourceName,
                type: 'other',
                amount: 1,
                unit: 'item',
                available: true
            });
        });

        return resources;
    }

    private calculateOverallProgress(goal: SMARTGoal): number {
        if (goal.status === GoalStatus.COMPLETED) return 100;
        if (goal.measurable.length === 0) return 0;

        const totalProgress = goal.measurable.reduce((sum, metric) => {
            const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
            return sum + Math.min(progress, 100);
        }, 0);

        return totalProgress / goal.measurable.length;
    }

    private calculateMetricProgress(goal: SMARTGoal): { [metricName: string]: number } {
        const metricProgress: { [metricName: string]: number } = {};

        goal.measurable.forEach(metric => {
            const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
            metricProgress[metric.name] = Math.min(progress, 100);
        });

        return metricProgress;
    }

    private calculateTimeProgress(goal: SMARTGoal): number {
        const startDate = new Date(goal.timeBound.startDate);
        const endDate = new Date(goal.timeBound.endDate);
        const today = new Date();

        if (today <= startDate) return 0;
        if (today >= endDate) return 100;

        const totalTime = endDate.getTime() - startDate.getTime();
        const elapsedTime = today.getTime() - startDate.getTime();

        return (elapsedTime / totalTime) * 100;
    }

    private getDaysRemaining(endDate: Date): number {
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private isGoalOnTrack(overallProgress: number, timeProgress: number): boolean {
        // Goal is on track if progress is within 10% of time progress
        return Math.abs(overallProgress - timeProgress) <= 10 || overallProgress >= timeProgress;
    }

    private generateProgressRecommendations(
        goal: SMARTGoal,
        overallProgress: number,
        timeProgress: number,
        isOnTrack: boolean
    ): string[] {
        const recommendations: string[] = [];

        if (!isOnTrack) {
            if (overallProgress < timeProgress - 20) {
                recommendations.push('You are significantly behind schedule. Consider dedicating more time or adjusting your approach.');
            } else if (overallProgress < timeProgress - 10) {
                recommendations.push('You are slightly behind schedule. Try to increase your daily effort.');
            }
        }

        if (overallProgress === 0 && timeProgress > 10) {
            recommendations.push('Consider breaking your goal into smaller, more manageable tasks to get started.');
        }

        if (overallProgress > 80) {
            recommendations.push('Great progress! You are close to achieving your goal. Stay focused and maintain momentum.');
        }

        if (goal.measurable.some(m => m.currentValue > m.targetValue)) {
            recommendations.push('You have exceeded some targets! Consider setting more ambitious goals for next time.');
        }

        const daysRemaining = this.getDaysRemaining(goal.timeBound.endDate);
        if (daysRemaining < 7 && overallProgress < 90) {
            recommendations.push('Less than a week remaining. Focus on the most important aspects to maximize completion.');
        }

        return recommendations;
    }
}