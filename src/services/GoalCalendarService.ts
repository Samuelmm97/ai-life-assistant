import { SMARTGoal, ScheduleEntry } from '../types';
import { ADKCalendarService } from './ADKCalendarService';
import { GoalService } from './GoalService';

export class GoalCalendarService {
    private adkCalendarService: ADKCalendarService;
    private goalService: GoalService;

    constructor() {
        this.adkCalendarService = new ADKCalendarService();
        this.goalService = new GoalService();
    }

    async initialize(): Promise<void> {
        await this.adkCalendarService.initialize();
    }

    async createTimeBlocksForGoal(goalId: string): Promise<ScheduleEntry[]> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Use ADK-enhanced time block creation with agent coordination
            const scheduledEntries = await this.adkCalendarService.createTimeBlocksForGoalWithADK(goalId, goal);

            return scheduledEntries;
        } catch (error) {
            console.error('Error creating time blocks for goal:', error);
            throw error;
        }
    }

    async getGoalScheduleEntries(goalId: string): Promise<ScheduleEntry[]> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                return [];
            }

            const allEntries = await this.adkCalendarService.getScheduleEntries(goal.userId);
            return allEntries.filter(entry => entry.goalId === goalId);
        } catch (error) {
            console.error('Error getting goal schedule entries:', error);
            return [];
        }
    }

    async updateGoalSchedule(goalId: string): Promise<void> {
        try {
            // Remove existing time blocks for this goal
            const existingEntries = await this.getGoalScheduleEntries(goalId);
            for (const entry of existingEntries) {
                await this.adkCalendarService.deleteScheduleEntry(entry.id);
            }

            // Create new time blocks with ADK coordination
            await this.createTimeBlocksForGoal(goalId);
        } catch (error) {
            console.error('Error updating goal schedule:', error);
            throw error;
        }
    }

    // ADK-enhanced methods
    async optimizeGoalSchedule(goalId: string): Promise<void> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Use ADK scheduler agent to optimize the schedule
            const optimizationResult = await this.adkCalendarService.optimizeScheduleWithADK(goal.userId);

            if (!optimizationResult.success) {
                console.warn('Schedule optimization failed:', optimizationResult.error);
            }
        } catch (error) {
            console.error('Error optimizing goal schedule:', error);
            throw error;
        }
    }

    async analyzeGoalAvailability(goalId: string): Promise<any> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Use ADK scheduler agent to analyze availability
            const availabilityResult = await this.adkCalendarService.analyzeAvailabilityWithADK(goal.userId);

            return availabilityResult.success ? availabilityResult.data : null;
        } catch (error) {
            console.error('Error analyzing goal availability:', error);
            return null;
        }
    }

    async coordinateWithDomains(goalId: string, domains: string[]): Promise<void> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Use ADK multi-domain coordination
            await this.adkCalendarService.coordinateMultiDomainScheduling(
                goal.userId,
                domains,
                { goalId, goal }
            );
        } catch (error) {
            console.error('Error coordinating with domains:', error);
            throw error;
        }
    }

    // Cleanup
    async cleanup(): Promise<void> {
        await this.adkCalendarService.cleanup();
    }
}