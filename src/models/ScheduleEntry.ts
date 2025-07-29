import { ScheduleEntry, Priority, FlexibilityLevel, RecurrencePattern, LifeDomain } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ScheduleEntryModel {
    static create(data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>): ScheduleEntry {
        const now = new Date();
        return {
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
            ...data
        };
    }

    static validate(entry: Partial<ScheduleEntry>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!entry.title?.trim()) {
            errors.push('Title is required');
        }

        if (!entry.startTime) {
            errors.push('Start time is required');
        }

        if (!entry.endTime) {
            errors.push('End time is required');
        }

        if (entry.startTime && entry.endTime && entry.startTime >= entry.endTime) {
            errors.push('End time must be after start time');
        }

        if (!entry.userId?.trim()) {
            errors.push('User ID is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static getDuration(entry: ScheduleEntry): number {
        return entry.endTime.getTime() - entry.startTime.getTime();
    }

    static isRecurring(entry: ScheduleEntry): boolean {
        return entry.recurrence?.type !== 'none' && entry.recurrence?.type !== undefined;
    }

    static getNextOccurrence(entry: ScheduleEntry, fromDate: Date = new Date()): Date | null {
        if (!this.isRecurring(entry) || !entry.recurrence) {
            return null;
        }

        const { type, interval, daysOfWeek, endDate } = entry.recurrence;
        const nextDate = new Date(fromDate);

        switch (type) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case 'weekly':
                if (daysOfWeek && daysOfWeek.length > 0) {
                    // Find next occurrence based on days of week
                    const currentDay = nextDate.getDay();
                    const nextDay = daysOfWeek.find(day => day > currentDay) || daysOfWeek[0];
                    const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
                    nextDate.setDate(nextDate.getDate() + daysToAdd);
                } else {
                    nextDate.setDate(nextDate.getDate() + (7 * interval));
                }
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
        }

        if (endDate && nextDate > endDate) {
            return null;
        }

        return nextDate;
    }

    static overlaps(entry1: ScheduleEntry, entry2: ScheduleEntry): boolean {
        return entry1.startTime < entry2.endTime && entry2.startTime < entry1.endTime;
    }
}