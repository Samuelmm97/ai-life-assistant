import { SMARTGoal, ScheduleEntry, TimeBlock } from '../types';
import { CalendarService } from './CalendarService';
import { GoalService } from './GoalService';

export class GoalCalendarService {
    private calendarService: CalendarService;
    private goalService: GoalService;

    constructor() {
        this.calendarService = new CalendarService();
        this.goalService = new GoalService();
    }

    async createTimeBlocksForGoal(goalId: string): Promise<ScheduleEntry[]> {
        try {
            const goal = await this.goalService.getGoal(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Create time blocks based on goal requirements
            const timeBlocks = await this.calendarService.createTimeBlocksForGoal(goal);

            // Schedule the time blocks
            const scheduledEntries = await this.calendarService.scheduleTimeBlocks(goal.userId, timeBlocks);

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

            const allEntries = await this.calendarService.getScheduleEntries(goal.userId);
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
                await this.calendarService.deleteScheduleEntry(entry.id);
            }

            // Create new time blocks
            await this.createTimeBlocksForGoal(goalId);
        } catch (error) {
            console.error('Error updating goal schedule:', error);
            throw error;
        }
    }
}