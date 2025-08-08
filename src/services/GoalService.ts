/**
 * Enhanced Goal Service with ADK Integration
 * Combines existing goal management with Python ADK agents
 */
import { SMARTGoal } from '../types';
import { ADKGoalPlanningService } from './ADKGoalPlanningService';
import { getPythonADKService } from './PythonADKService';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class GoalService {
    private adkService: ADKGoalPlanningService;
    private pythonADKService = getPythonADKService();
    private database: InMemoryDatabase;

    constructor() {
        this.adkService = new ADKGoalPlanningService();
        this.database = InMemoryDatabase.getInstance();
    }

    /**
     * Create a new goal using ADK agents for intelligent planning
     */
    async createGoal(userInput: string): Promise<SMARTGoal> {
        try {
            // Use ADK agents to plan the goal
            const plannedGoal = await this.adkService.planGoalFromText(userInput);

            // Save to database
            const savedGoal = this.database.createGoal(plannedGoal);

            return savedGoal.toJSON();
        } catch (error) {
            console.error('Failed to create goal with ADK:', error);
            throw error;
        }
    }

    /**
     * Create a goal from structured data (for orchestration service)
     */
    async createGoalFromData(goalData: Omit<SMARTGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMARTGoal> {
        try {
            // Save to database
            const savedGoalModel = this.database.createGoal(goalData);
            return savedGoalModel.toJSON();
        } catch (error) {
            console.error('Failed to create goal from data:', error);
            throw error;
        }
    }

    /**
     * Analyze an existing goal using ADK agents
     */
    async analyzeGoal(goalId: string) {
        const goalModel = this.database.getGoalById(goalId);
        if (!goalModel) {
            throw new Error('Goal not found');
        }

        const goal = goalModel.toJSON();
        return await this.adkService.analyzeGoal(goal);
    }

    /**
     * Refine a goal based on feedback using ADK agents
     */
    async refineGoal(goalId: string, feedback: string): Promise<SMARTGoal> {
        const goalModel = this.database.getGoalById(goalId);
        if (!goalModel) {
            throw new Error('Goal not found');
        }

        const goal = goalModel.toJSON();

        // For now, return the original goal since refineGoal is not implemented
        // TODO: Implement goal refinement in ADK service
        const refinedGoal = goal;

        // Update in database
        const updatedGoalModel = this.database.updateGoal(goalId, refinedGoal);
        if (!updatedGoalModel) {
            throw new Error('Failed to update goal');
        }

        return updatedGoalModel.toJSON();
    }

    /**
     * Generate SMART criteria suggestions using ADK agents
     */
    async generateSMARTCriteria(title: string, description: string) {
    // For now, return basic criteria since generateSMARTCriteria is not implemented
    // TODO: Implement SMART criteria generation in ADK service
        return {
            specific: { suggestions: [`Define exactly what you want to achieve with "${title}"`] },
            measurable: { suggestions: [`Identify how you will measure progress on "${title}"`] },
            achievable: { suggestions: [`Ensure "${title}" is realistic given your resources`] },
            relevant: { suggestions: [`Confirm "${title}" aligns with your priorities`] },
            timeBound: { suggestions: [`Set a clear deadline for "${title}"`] }
        };
    }

    /**
     * Get all goals
     */
    getAllGoals(): SMARTGoal[] {
        return this.database.getAllGoals().map(model => model.toJSON());
    }

    /**
     * Get goals for a specific user
     */
    async getUserGoals(userId: string): Promise<SMARTGoal[]> {
        return this.database.getGoalsByUserId(userId).map(model => model.toJSON());
    }

    /**
     * Get a specific goal
     */
    getGoal(id: string): SMARTGoal | null {
        const goalModel = this.database.getGoalById(id);
        return goalModel ? goalModel.toJSON() : null;
    }

    /**
     * Update a goal
     */
    updateGoal(id: string, updates: Partial<SMARTGoal>): SMARTGoal | null {
        const updatedModel = this.database.updateGoal(id, updates);
        return updatedModel ? updatedModel.toJSON() : null;
    }

    /**
     * Delete a goal
     */
    deleteGoal(id: string): boolean {
        return this.database.deleteGoal(id);
    }

    /**
     * Update goal progress by updating measurable metrics
     */
    updateProgress(id: string, progress: number): SMARTGoal | null {
        // This method is deprecated - progress should be updated through measurable metrics
        // For backward compatibility, we'll just update the updatedAt timestamp
        const updatedModel = this.database.updateGoal(id, {
            updatedAt: new Date()
        });
        return updatedModel ? updatedModel.toJSON() : null;
    }

    /**
     * Toggle milestone completion
     */
    toggleMilestone(goalId: string, milestoneIndex: number): SMARTGoal {
        const goalModel = this.database.getGoalById(goalId);
        if (!goalModel) {
            throw new Error('Goal not found');
        }

        const goal = goalModel.toJSON();

        if (milestoneIndex >= 0 && milestoneIndex < goal.timeBound.milestones.length) {
            const updatedMilestones = [...goal.timeBound.milestones];
            // Note: This is a simplified implementation since milestones are just dates
            // In a full implementation, milestones would have completion status

            const updatedModel = this.database.updateGoal(goalId, {
                timeBound: {
                    ...goal.timeBound,
                    milestones: updatedMilestones
                },
                updatedAt: new Date()
            });

            return updatedModel ? updatedModel.toJSON() : goal;
        }

        return goal;
    }

    /**
     * Get ADK service status
     */
    async getADKServiceStatus() {
        const healthCheck = await this.pythonADKService.checkHealth();
        const agentsInfo = await this.pythonADKService.getAgentsInfo();

        return {
            available: healthCheck,
            message: healthCheck
                ? 'Python ADK agents are available for enhanced goal planning'
                : 'Python ADK service unavailable - using fallback goal planning',
            agentsInfo: agentsInfo,
            serviceUrl: 'http://localhost:5000'
        };
    }

    /**
     * Validate a goal using traditional SMART criteria
     */
    async validateGoal(goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<any> {
        // Basic SMART validation
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Check Specific
        if (!goalData.specific || goalData.specific.length < 10) {
            errors.push('Goal needs to be more specific (at least 10 characters)');
        }

        // Check Measurable
        if (!goalData.measurable || goalData.measurable.length === 0) {
            errors.push('Goal needs at least one measurable metric');
        } else {
            goalData.measurable.forEach((metric, index) => {
                if (!metric.name || !metric.unit || metric.targetValue <= 0) {
                    errors.push(`Metric ${index + 1} is incomplete`);
                }
            });
        }

        // Check Time-bound
        if (!goalData.timeBound.endDate || goalData.timeBound.endDate <= goalData.timeBound.startDate) {
            errors.push('Goal needs a valid end date after the start date');
        }

        // Add suggestions
        if (goalData.achievable.requiredResources.length === 0) {
            suggestions.push('Consider adding required resources to make the goal more achievable');
        }

        if (goalData.relevant.personalValues.length === 0) {
            suggestions.push('Adding personal values will help maintain motivation');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Get goals by category
     */
    getGoalsByCategory(category: string): SMARTGoal[] {
        return this.database.getAllGoals()
            .map(model => model.toJSON())
            .filter(goal => (goal as any).category === category);
    }

    /**
     * Get goals by status
     */
    getGoalsByStatus(status: string): SMARTGoal[] {
        return this.database.getAllGoals()
            .map(model => model.toJSON())
            .filter(goal => goal.status === status);
    }

    /**
     * Get goals by priority
     */
    getGoalsByPriority(priority: string): SMARTGoal[] {
        return this.database.getAllGoals()
            .map(model => model.toJSON())
            .filter(goal => (goal as any).priority === priority);
    }

    /**
     * Search goals by text
     */
    searchGoals(query: string): SMARTGoal[] {
        const lowerQuery = query.toLowerCase();
        return this.database.getAllGoals()
            .map(model => model.toJSON())
            .filter(goal =>
                goal.title.toLowerCase().includes(lowerQuery) ||
                goal.description.toLowerCase().includes(lowerQuery) ||
                goal.specific.toLowerCase().includes(lowerQuery)
            );
    }

    /**
     * Get goal adjustments (placeholder implementation)
     */
    async getGoalAdjustments(goalId: string): Promise<any[]> {
        // For now, return empty array since adjustments are not implemented
        // TODO: Implement goal adjustments functionality
        return [];
    }

    /**
     * Get action plan for a goal (placeholder implementation)
     */
    async getActionPlan(goalId: string): Promise<any[]> {
        // For now, return empty array since action plans are not implemented
        // TODO: Implement action plan functionality
        return [];
    }

    /**
     * Get goal action plan (returns null for now since not implemented)
     */
    async getGoalActionPlan(goalId: string): Promise<any | null> {
        // For now, return null since action plans are not implemented
        // TODO: Implement action plan functionality
        return null;
    }

    /**
     * Update metric progress for a goal
     */
    async updateMetricProgress(goalId: string, metricName: string, newValue: number): Promise<void> {
        // For now, this is a placeholder implementation
        // TODO: Implement metric progress tracking
        console.log(`Updating metric ${metricName} for goal ${goalId} to ${newValue}`);
    }

    /**
     * Get goal progress report
     */
    async getGoalProgress(goalId: string): Promise<any> {
        const goal = this.getGoal(goalId);
        if (!goal) {
            return null;
        }

        // Calculate progress from measurable metrics
        const totalProgress = goal.measurable.reduce((sum, metric) => {
            const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
            return sum + Math.min(progress, 100);
        }, 0);
        const overallProgress = goal.measurable.length > 0 ? totalProgress / goal.measurable.length : 0;

        // Return basic progress information
        return {
            goalId: goal.id,
            title: goal.title,
            progress: overallProgress,
            status: goal.status,
            completedMilestones: 0, // Milestones are just dates, no completion status
            totalMilestones: goal.timeBound.milestones.length,
            lastUpdated: goal.updatedAt
        };
    }

    /**
     * Get dashboard data for a user
     */
    async getDashboardData(userId: string): Promise<any> {
        const goals = await this.getUserGoals(userId);

        const activeGoals = goals.filter(goal => goal.status === 'active');
        const completedGoals = goals.filter(goal => goal.status === 'completed');

        // Calculate overall progress
        const totalProgress = goals.reduce((sum, goal) => {
            const goalProgress = goal.measurable.reduce((metricSum, metric) => {
                const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
                return metricSum + Math.min(progress, 100);
            }, 0);
            return sum + (goal.measurable.length > 0 ? goalProgress / goal.measurable.length : 0);
        }, 0);

        const overallProgress = goals.length > 0 ? totalProgress / goals.length : 0;

        return {
            totalGoals: goals.length,
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            overallProgress: overallProgress,
            recentGoals: goals.slice(0, 5),
            insights: [
                `You have ${activeGoals.length} active goals`,
                `Overall progress: ${overallProgress.toFixed(1)}%`,
                `${completedGoals.length} goals completed`
            ],
            recommendations: [
                'Focus on your most important goals first',
                'Update your progress regularly',
                'Break down large goals into smaller tasks'
            ]
        };
    }
}