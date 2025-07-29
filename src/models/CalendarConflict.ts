import { CalendarConflict, ScheduleEntry } from '../types';
import { ScheduleEntryModel } from './ScheduleEntry';
import { v4 as uuidv4 } from 'uuid';

export class CalendarConflictModel {
    static detectConflicts(entries: ScheduleEntry[]): CalendarConflict[] {
        const conflicts: CalendarConflict[] = [];

        // Check for overlapping entries
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const entry1 = entries[i];
                const entry2 = entries[j];

                if (ScheduleEntryModel.overlaps(entry1, entry2)) {
                    const conflict = this.createOverlapConflict([entry1, entry2]);
                    conflicts.push(conflict);
                }
            }
        }

        // Check for dependency conflicts
        const dependencyConflicts = this.detectDependencyConflicts(entries);
        conflicts.push(...dependencyConflicts);

        return conflicts;
    }

    private static createOverlapConflict(conflictingEntries: ScheduleEntry[]): CalendarConflict {
        const severity = this.calculateOverlapSeverity(conflictingEntries);
        const suggestions = this.generateOverlapSuggestions(conflictingEntries);

        return {
            id: uuidv4(),
            conflictingEntries,
            type: 'overlap',
            severity,
            suggestions
        };
    }

    private static calculateOverlapSeverity(entries: ScheduleEntry[]): 'low' | 'medium' | 'high' {
        // Check if any entry is fixed (cannot be moved)
        const hasFixedEntry = entries.some(entry => entry.flexibility === 'fixed');
        if (hasFixedEntry) return 'high';

        // Check if entries are goal-related
        const hasGoalEntry = entries.some(entry => entry.goalId);
        if (hasGoalEntry) return 'medium';

        return 'low';
    }

    private static generateOverlapSuggestions(entries: ScheduleEntry[]): string[] {
        const suggestions: string[] = [];

        const flexibleEntries = entries.filter(entry => entry.flexibility !== 'fixed');
        const fixedEntries = entries.filter(entry => entry.flexibility === 'fixed');

        if (flexibleEntries.length > 0) {
            suggestions.push(`Move ${flexibleEntries[0].title} to a different time slot`);

            if (flexibleEntries.length > 1) {
                suggestions.push(`Reschedule ${flexibleEntries.slice(1).map(e => e.title).join(', ')} to avoid overlap`);
            }
        }

        if (fixedEntries.length > 0 && flexibleEntries.length > 0) {
            suggestions.push(`${fixedEntries[0].title} cannot be moved - adjust other activities around it`);
        }

        suggestions.push('Consider reducing duration of one or more activities');

        return suggestions;
    }

    private static detectDependencyConflicts(entries: ScheduleEntry[]): CalendarConflict[] {
        const conflicts: CalendarConflict[] = [];
        const entryMap = new Map(entries.map(entry => [entry.id, entry]));

        for (const entry of entries) {
            for (const depId of entry.dependencies) {
                const dependency = entryMap.get(depId);
                if (dependency && dependency.endTime > entry.startTime) {
                    conflicts.push({
                        id: uuidv4(),
                        conflictingEntries: [dependency, entry],
                        type: 'dependency',
                        severity: 'high',
                        suggestions: [
                            `${entry.title} depends on ${dependency.title} but is scheduled before it completes`,
                            `Move ${entry.title} to start after ${dependency.title} ends`,
                            'Remove the dependency if it\'s not actually required'
                        ]
                    });
                }
            }
        }

        return conflicts;
    }

    static resolveSuggestion(conflict: CalendarConflict, suggestionIndex: number): ScheduleEntry[] {
        // This would implement automatic conflict resolution
        // For MVP, we'll just return the original entries
        return conflict.conflictingEntries;
    }
}