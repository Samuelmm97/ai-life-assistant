// ADK-integrated Calendar Service - Bridges traditional services with ADK agents
import { ScheduleEntry, CalendarConflict, TimeBlock, SMARTGoal } from '../types';
import { CalendarService } from './CalendarService';
import { SchedulerAgent } from '../agents/domain/SchedulerAgent';
import { AgentOrchestrator } from '../agents/core/AgentOrchestrator';
import { AgentContext, WorkflowResult } from '../agents/core/ADKAgent';

export class ADKCalendarService {
    private calendarService: CalendarService;
    private schedulerAgent: SchedulerAgent;
    private orchestrator: AgentOrchestrator;

    constructor() {
        this.calendarService = new CalendarService();
        this.schedulerAgent = new SchedulerAgent();
        this.orchestrator = new AgentOrchestrator();

        // Register the scheduler agent with orchestrator
        this.orchestrator.registerAgent('scheduler', this.schedulerAgent);
    }

    async initialize(): Promise<void> {
        await this.schedulerAgent.initialize();
    }

    // ADK-enhanced schedule entry creation with agent coordination
    async createScheduleEntryWithADK(
        userId: string,
        entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>,
        coordinateWithDomains: string[] = []
    ): Promise<ScheduleEntry> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { entry },
            timestamp: new Date()
        };

        // First create the entry using traditional service
        const createdEntry = await this.calendarService.createScheduleEntry(entry);

        // If coordination is needed, orchestrate with other domain agents
        if (coordinateWithDomains.length > 0) {
            const orchestrationResult = await this.orchestrator.orchestrateAgents({
                initiatingAgent: 'scheduler',
                targetDomains: coordinateWithDomains,
                context,
                parameters: {
                    action: 'coordinate_schedule_entry',
                    scheduleEntry: createdEntry
                }
            });

            if (!orchestrationResult.success) {
                console.warn('Agent coordination failed:', orchestrationResult.errors);
            }
        }

        return createdEntry;
    }

    // ADK-enhanced time block creation for goals
    async createTimeBlocksForGoalWithADK(goalId: string, goal: SMARTGoal): Promise<ScheduleEntry[]> {
        const context: AgentContext = {
            userId: goal.userId,
            sessionId: `session_${Date.now()}`,
            metadata: { goal },
            timestamp: new Date()
        };

        // Use scheduler agent to create intelligent time blocks
        const timeBlockResult = await this.schedulerAgent.execute(context, {
            action: 'create_time_blocks',
            goalId,
            goal
        });

        if (!timeBlockResult.success) {
            throw new Error(`Failed to create time blocks: ${timeBlockResult.error}`);
        }

        const timeBlocks = timeBlockResult.data?.timeBlocks || [];

        // Convert time blocks to schedule entries using traditional service
        const scheduledEntries = await this.calendarService.scheduleTimeBlocks(goal.userId, timeBlocks);

        // Coordinate with relevant domain agents based on goal's life areas
        if (goal.relevant.lifeAreas.length > 0) {
            await this.orchestrator.orchestrateAgents({
                initiatingAgent: 'scheduler',
                targetDomains: goal.relevant.lifeAreas,
                context,
                parameters: {
                    action: 'coordinate_goal_schedule',
                    goalId,
                    scheduleEntries: scheduledEntries
                }
            });
        }

        return scheduledEntries;
    }

    // ADK-enhanced conflict resolution
    async resolveConflictsWithADK(userId: string, conflicts: CalendarConflict[]): Promise<CalendarConflict[]> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: { conflicts },
            timestamp: new Date()
        };

        const resolutionResult = await this.schedulerAgent.execute(context, {
            action: 'resolve_conflicts',
            conflicts
        });

        if (!resolutionResult.success) {
            throw new Error(`Failed to resolve conflicts: ${resolutionResult.error}`);
        }

        // Apply the resolutions from the agent
        const resolutions = resolutionResult.data?.resolutions || [];
        const resolvedConflicts: CalendarConflict[] = [];

        for (const resolution of resolutions) {
            // Apply the resolution suggestions
            const conflict = conflicts.find(c => c.id === resolution.conflictId);
            if (conflict) {
                // Update the conflict with resolution status
                const resolvedConflict = {
                    ...conflict,
                    resolved: true,
                    resolution: resolution.resolution,
                    appliedSuggestions: resolution.appliedSuggestions
                };
                resolvedConflicts.push(resolvedConflict);
            }
        }

        return resolvedConflicts;
    }

    // ADK-enhanced schedule optimization
    async optimizeScheduleWithADK(userId: string): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: {},
            timestamp: new Date()
        };

        return await this.schedulerAgent.execute(context, {
            action: 'optimize_schedule'
        });
    }

    // ADK-enhanced availability analysis
    async analyzeAvailabilityWithADK(userId: string): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: {},
            timestamp: new Date()
        };

        return await this.schedulerAgent.execute(context, {
            action: 'analyze_availability'
        });
    }

    // Agent transfer to other domains
    async transferToAgent(targetDomain: string, userId: string, transferData: any): Promise<WorkflowResult> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: transferData,
            timestamp: new Date()
        };

        return await this.orchestrator.transferBetweenAgents('scheduler', targetDomain, context);
    }

    // Multi-domain coordination for complex scheduling
    async coordinateMultiDomainScheduling(
        userId: string,
        domains: string[],
        schedulingData: any
    ): Promise<WorkflowResult[]> {
        const context: AgentContext = {
            userId,
            sessionId: `session_${Date.now()}`,
            metadata: schedulingData,
            timestamp: new Date()
        };

        const orchestrationResult = await this.orchestrator.orchestrateAgents({
            initiatingAgent: 'scheduler',
            targetDomains: domains,
            context,
            parameters: {
                action: 'coordinate_multi_domain_scheduling',
                schedulingData
            }
        });

        return Object.values(orchestrationResult.results);
    }

    // Traditional service methods with ADK enhancement
    async getScheduleEntries(userId: string, startDate?: Date, endDate?: Date): Promise<ScheduleEntry[]> {
        return await this.calendarService.getScheduleEntries(userId, startDate, endDate);
    }

    async updateScheduleEntry(entryId: string, updates: Partial<ScheduleEntry>): Promise<ScheduleEntry | null> {
        return await this.calendarService.updateScheduleEntry(entryId, updates);
    }

    async deleteScheduleEntry(entryId: string): Promise<boolean> {
        return await this.calendarService.deleteScheduleEntry(entryId);
    }

    async detectConflicts(userId: string, dateRange?: { start: Date; end: Date }): Promise<CalendarConflict[]> {
        const conflicts = await this.calendarService.detectConflicts(userId, dateRange);

        // Enhance conflict detection with ADK agent analysis
        if (conflicts.length > 0) {
            const enhancedConflicts = await this.resolveConflictsWithADK(userId, conflicts);
            return enhancedConflicts;
        }

        return conflicts;
    }

    async importFromGoogleCalendar(userId: string, accessToken: string): Promise<ScheduleEntry[]> {
        const importedEntries = await this.calendarService.importFromGoogleCalendar(userId, accessToken);

        // Use ADK agent to analyze and optimize imported schedule
        if (importedEntries.length > 0) {
            const context: AgentContext = {
                userId,
                sessionId: `session_${Date.now()}`,
                metadata: { importedEntries },
                timestamp: new Date()
            };

            await this.schedulerAgent.execute(context, {
                action: 'integrate_schedule',
                importedEntries
            });
        }

        return importedEntries;
    }

    // Cleanup
    async cleanup(): Promise<void> {
        await this.orchestrator.shutdown();
    }
}