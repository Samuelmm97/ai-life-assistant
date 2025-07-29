import { database } from '../database';
import { SMARTGoal, GoalStatus } from '../types';
import { SMARTGoalEngine, ValidationResult, ProgressReport, Adjustment } from './SMARTGoalEngine';
import { ActionPlan } from '../models/ActionPlan';

export class GoalService {
    private smartGoalEngine: SMARTGoalEngine;

    constructor() {
        this.smartGoalEngine = new SMARTGoalEngine();
    }

    /**
     * Validates a goal before creation
     */
    public async validateGoal(goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ValidationResult> {
        return this.smartGoalEngine.validateGoal(goalData);
    }

    /**
     * Creates a new SMART goal with validation
     */
    public async createGoal(
        userId: string,
        goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<{ goal: SMARTGoal; actionPlan: ActionPlan; validation: ValidationResult }> {
        // Validate the goal first
        const validation = await this.validateGoal(goalData);

        if (!validation.isValid) {
            throw new Error(`Goal validation failed: ${validation.errors.join(', ')}`);
        }

        // Create the goal
        const goal = database.createGoal({
            ...goalData,
            userId,
            status: goalData.status || GoalStatus.ACTIVE
        });

        // Generate action plan
        const actionPlanData = await this.smartGoalEngine.generateActionPlan(goal.toJSON());
        const actionPlan = database.createActionPlan(actionPlanData);

        return {
            goal: goal.toJSON(),
            actionPlan: actionPlan.toJSON(),
            validation
        };
    }

    /**
     * Updates an existing goal
     */
    public async updateGoal(
        goalId: string,
        updates: Partial<Omit<SMARTGoal, 'id' | 'createdAt'>>
    ): Promise<SMARTGoal | null> {
        const updatedGoal = database.updateGoal(goalId, updates);
        return updatedGoal ? updatedGoal.toJSON() : null;
    }

    /**
     * Gets a goal by ID
     */
    public async getGoal(goalId: string): Promise<SMARTGoal | null> {
        const goal = database.getGoalById(goalId);
        return goal ? goal.toJSON() : null;
    }

    /**
     * Gets all goals for a user
     */
    public async getUserGoals(userId: string): Promise<SMARTGoal[]> {
        const goals = database.getGoalsByUserId(userId);
        return goals.map(goal => goal.toJSON());
    }

    /**
     * Deletes a goal and its associated action plan
     */
    public async deleteGoal(goalId: string): Promise<boolean> {
        // Delete associated action plan first
        const actionPlan = database.getActionPlanByGoalId(goalId);
        if (actionPlan) {
            database.deleteActionPlan(actionPlan.id);
        }

        // Delete the goal
        return database.deleteGoal(goalId);
    }

    /**
     * Gets progress report for a goal
     */
    public async getGoalProgress(goalId: string): Promise<ProgressReport | null> {
        const goal = database.getGoalById(goalId);
        if (!goal) return null;

        return await this.smartGoalEngine.trackProgress(goalId, goal.toJSON());
    }

    /**
     * Updates progress for a specific metric
     */
    public async updateMetricProgress(
        goalId: string,
        metricName: string,
        newValue: number
    ): Promise<SMARTGoal | null> {
        const goal = database.getGoalById(goalId);
        if (!goal) return null;

        const updatedMeasurable = goal.measurable.map((metric: any) =>
            metric.name === metricName ? { ...metric, currentValue: newValue } : metric
        );

        return await this.updateGoal(goalId, { measurable: updatedMeasurable });
    }

    /**
     * Gets adjustment suggestions for a goal
     */
    public async getGoalAdjustments(goalId: string): Promise<Adjustment[]> {
        const goal = database.getGoalById(goalId);
        if (!goal) return [];

        const progressReport = await this.smartGoalEngine.trackProgress(goalId, goal.toJSON());
        return await this.smartGoalEngine.suggestAdjustments(goalId, goal.toJSON(), progressReport);
    }

    /**
     * Gets action plan for a goal
     */
    public async getGoalActionPlan(goalId: string): Promise<ActionPlan | null> {
        const actionPlan = database.getActionPlanByGoalId(goalId);
        return actionPlan ? actionPlan.toJSON() : null;
    }

    /**
     * Updates action plan task completion
     */
    public async updateTaskCompletion(actionPlanId: string, taskId: string, completed: boolean): Promise<ActionPlan | null> {
        const actionPlan = database.getActionPlanById(actionPlanId);
        if (!actionPlan) return null;

        const success = completed ? actionPlan.completeTask(taskId) : false;
        if (!success && !completed) {
            // Handle uncompleting a task
            const task = actionPlan.tasks.find((t: any) => t.id === taskId);
            if (task) {
                task.completed = false;
                task.completedAt = undefined;
                actionPlan.updatedAt = new Date();
            }
        }

        return actionPlan.toJSON();
    }

    /**
     * Updates action plan milestone completion
     */
    public async updateMilestoneCompletion(actionPlanId: string, milestoneId: string, completed: boolean): Promise<ActionPlan | null> {
        const actionPlan = database.getActionPlanById(actionPlanId);
        if (!actionPlan) return null;

        const success = completed ? actionPlan.completeMilestone(milestoneId) : false;
        if (!success && !completed) {
            // Handle uncompleting a milestone
            const milestone = actionPlan.milestones.find((m: any) => m.id === milestoneId);
            if (milestone) {
                milestone.completed = false;
                milestone.completedAt = undefined;
                actionPlan.updatedAt = new Date();
            }
        }

        return actionPlan.toJSON();
    }

    /**
     * Gets dashboard data for a user
     */
    public async getDashboardData(userId: string): Promise<{
        goals: SMARTGoal[];
        totalGoals: number;
        activeGoals: number;
        completedGoals: number;
        overallProgress: number;
        recentProgress: ProgressReport[];
    }> {
        const goals = await this.getUserGoals(userId);
        const activeGoals = goals.filter(g => g.status === GoalStatus.ACTIVE);
        const completedGoals = goals.filter(g => g.status === GoalStatus.COMPLETED);
        const overallProgress = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

        // Get progress reports for active goals
        const recentProgress: ProgressReport[] = [];
        for (const goal of activeGoals.slice(0, 5)) { // Limit to 5 most recent
            const progress = await this.getGoalProgress(goal.id);
            if (progress) {
                recentProgress.push(progress);
            }
        }

        return {
            goals,
            totalGoals: goals.length,
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            overallProgress,
            recentProgress
        };
    }
}