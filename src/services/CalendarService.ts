import { ScheduleEntry, CalendarConflict, TimeBlock, SMARTGoal, RecurrenceType, FlexibilityLevel, Priority } from '../types';
import { ScheduleEntryModel, CalendarConflictModel } from '../models';
import { InMemoryDatabase } from '../database/InMemoryDatabase';

export class CalendarService {
    private db: InMemoryDatabase;

    constructor() {
        this.db = InMemoryDatabase.getInstance();
    }

    async createScheduleEntry(entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEntry> {
        const validation = ScheduleEntryModel.validate(entry);
        if (!validation.isValid) {
            throw new Error(`Invalid schedule entry: ${validation.errors.join(', ')}`);
        }

        const newEntry = ScheduleEntryModel.create(entry);
        await this.db.scheduleEntries.create(newEntry);
        return newEntry;
    }

    async getScheduleEntries(userId: string, startDate?: Date, endDate?: Date): Promise<ScheduleEntry[]> {
        const allEntries = await this.db.scheduleEntries.findByUserId(userId);

        if (!startDate && !endDate) {
            return allEntries;
        }

        return allEntries.filter(entry => {
            if (startDate && entry.endTime < startDate) return false;
            if (endDate && entry.startTime > endDate) return false;
            return true;
        });
    }

    async updateScheduleEntry(entryId: string, updates: Partial<ScheduleEntry>): Promise<ScheduleEntry | null> {
        const existing = await this.db.scheduleEntries.findById(entryId);
        if (!existing) return null;

        const updated = { ...existing, ...updates, updatedAt: new Date() };
        const validation = ScheduleEntryModel.validate(updated);

        if (!validation.isValid) {
            throw new Error(`Invalid schedule entry update: ${validation.errors.join(', ')}`);
        }

        await this.db.scheduleEntries.update(entryId, updated);
        return updated;
    }

    async deleteScheduleEntry(entryId: string): Promise<boolean> {
        return await this.db.scheduleEntries.delete(entryId);
    }

    async detectConflicts(userId: string, dateRange?: { start: Date; end: Date }): Promise<CalendarConflict[]> {
        const entries = await this.getScheduleEntries(userId, dateRange?.start, dateRange?.end);
        return CalendarConflictModel.detectConflicts(entries);
    }

    async createTimeBlocksForGoal(goal: SMARTGoal): Promise<TimeBlock[]> {
        // Simple time block creation based on goal requirements
        const timeBlocks: TimeBlock[] = [];

        // For each life domain in the goal, create appropriate time blocks
        for (const domain of goal.relevant.lifeAreas) {
            const timeBlock: TimeBlock = {
                id: `${goal.id}-${domain}`,
                goalId: goal.id,
                title: `${goal.title} - ${domain}`,
                duration: { hours: 1 }, // Default 1 hour blocks
                preferredTimes: this.getPreferredTimesForDomain(domain),
                frequency: {
                    type: RecurrenceType.WEEKLY,
                    interval: 1,
                    daysOfWeek: [1, 3, 5] // Mon, Wed, Fri
                },
                flexibility: FlexibilityLevel.FLEXIBLE
            };

            timeBlocks.push(timeBlock);
        }

        return timeBlocks;
    }

    async scheduleTimeBlocks(userId: string, timeBlocks: TimeBlock[]): Promise<ScheduleEntry[]> {
        const scheduledEntries: ScheduleEntry[] = [];
        const existingEntries = await this.getScheduleEntries(userId);

        for (const block of timeBlocks) {
            const entry = await this.findAvailableSlot(userId, block, existingEntries);
            if (entry) {
                const created = await this.createScheduleEntry(entry);
                scheduledEntries.push(created);
                existingEntries.push(created); // Add to existing for next iteration
            }
        }

        return scheduledEntries;
    }

    private getPreferredTimesForDomain(domain: string): string[] {
        // Simple domain-based time preferences
        switch (domain) {
            case 'fitness':
                return ['morning', 'evening'];
            case 'learning':
                return ['morning', 'afternoon'];
            case 'nutrition':
                return ['morning', 'afternoon', 'evening'];
            default:
                return ['morning', 'afternoon', 'evening'];
        }
    }

    private async findAvailableSlot(
        userId: string,
        timeBlock: TimeBlock,
        existingEntries: ScheduleEntry[]
    ): Promise<Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> | null> {
        // Simple slot finding - try to schedule for next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0); // Start at 9 AM

        const durationMs = (timeBlock.duration.hours || 1) * 60 * 60 * 1000;

        // Try each day of the week
        for (let day = 0; day < 7; day++) {
            const tryDate = new Date(nextWeek);
            tryDate.setDate(tryDate.getDate() + day);

            // Try different hours of the day
            for (let hour = 9; hour <= 17; hour++) {
                tryDate.setHours(hour, 0, 0, 0);
                const endTime = new Date(tryDate.getTime() + durationMs);

                const testEntry: ScheduleEntry = {
                    id: 'test',
                    userId,
                    title: timeBlock.title,
                    description: `Time block for goal: ${timeBlock.goalId}`,
                    startTime: new Date(tryDate),
                    endTime,
                    goalId: timeBlock.goalId,
                    priority: Priority.MEDIUM,
                    flexibility: timeBlock.flexibility,
                    dependencies: [],
                    isImported: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Check if this slot conflicts with existing entries
                const hasConflict = existingEntries.some(existing =>
                    ScheduleEntryModel.overlaps(testEntry, existing)
                );

                if (!hasConflict) {
                    return {
                        userId,
                        title: timeBlock.title,
                        description: `Time block for goal: ${timeBlock.goalId}`,
                        startTime: new Date(tryDate),
                        endTime,
                        goalId: timeBlock.goalId,
                        priority: Priority.MEDIUM,
                        flexibility: timeBlock.flexibility,
                        dependencies: [],
                        isImported: false
                    };
                }
            }
        }

        return null; // No available slot found
    }

    // Simple Google Calendar import simulation
    async importFromGoogleCalendar(userId: string, accessToken: string): Promise<ScheduleEntry[]> {
        // This is a mock implementation for MVP
        // In a real implementation, this would use Google Calendar API

        const mockImportedEntries: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                userId,
                title: 'Team Meeting',
                description: 'Weekly team sync',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
                priority: Priority.HIGH,
                flexibility: FlexibilityLevel.FIXED,
                dependencies: [],
                isImported: true,
                source: 'google'
            },
            {
                userId,
                title: 'Doctor Appointment',
                description: 'Annual checkup',
                startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
                endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
                priority: Priority.HIGH,
                flexibility: FlexibilityLevel.FIXED,
                dependencies: [],
                isImported: true,
                source: 'google'
            }
        ];

        const importedEntries: ScheduleEntry[] = [];
        for (const entryData of mockImportedEntries) {
            try {
                const entry = await this.createScheduleEntry(entryData);
                importedEntries.push(entry);
            } catch (error) {
                console.error('Failed to import entry:', entryData.title, error);
            }
        }

        return importedEntries;
    }
}