import {
    SMARTCriteriaGenerator,
    GoalIntent,
    TimeframeInfo,
    GeneratedSMARTComponent,
    MeasurableMetric,
    AchievabilityAssessment,
    RelevanceContext,
    TimeConstraint,
    LifeDomain,
    ConfidenceLevel,
    UrgencyLevel,
    Duration,
    AIGoalPlanningError
} from '../types';
import { AIGoalPlanningUtils } from '../types/ai-goal-planning-utils';

export class SMARTCriteriaGeneratorService implements SMARTCriteriaGenerator {
    private readonly domainTemplates: Map<LifeDomain, {
        specificTemplates: string[];
        commonMetrics: { name: string; unit: string; defaultTarget: number }[];
        typicalResources: string[];
        personalValues: string[];
    }> = new Map([
        [LifeDomain.FITNESS, {
            specificTemplates: [
                'Achieve {outcome} through consistent {action} training',
                'Improve physical fitness by {action} with focus on {outcome}',
                'Build strength and endurance through {action} to {outcome}'
            ],
            commonMetrics: [
                { name: 'weight_loss', unit: 'pounds', defaultTarget: 10 },
                { name: 'workout_sessions', unit: 'sessions', defaultTarget: 12 },
                { name: 'exercise_duration', unit: 'minutes', defaultTarget: 30 }
            ],
            typicalResources: ['gym membership', 'workout equipment', 'personal trainer', 'fitness app'],
            personalValues: ['health', 'discipline', 'self-improvement', 'energy']
        }],
        [LifeDomain.LEARNING, {
            specificTemplates: [
                'Master {outcome} by {action} through structured learning',
                'Develop expertise in {outcome} through dedicated {action}',
                'Acquire {outcome} skills by consistently {action}'
            ],
            commonMetrics: [
                { name: 'study_hours', unit: 'hours', defaultTarget: 40 },
                { name: 'courses_completed', unit: 'courses', defaultTarget: 1 },
                { name: 'practice_sessions', unit: 'sessions', defaultTarget: 20 }
            ],
            typicalResources: ['online courses', 'books', 'practice materials', 'mentor'],
            personalValues: ['growth', 'knowledge', 'career advancement', 'curiosity']
        }],
        [LifeDomain.FINANCE, {
            specificTemplates: [
                'Achieve financial goal of {outcome} by {action} consistently',
                'Build financial security through {action} to reach {outcome}',
                'Improve financial health by {action} towards {outcome}'
            ],
            commonMetrics: [
                { name: 'savings_amount', unit: 'dollars', defaultTarget: 1000 },
                { name: 'monthly_savings', unit: 'dollars', defaultTarget: 200 },
                { name: 'debt_reduction', unit: 'dollars', defaultTarget: 500 }
            ],
            typicalResources: ['budgeting app', 'financial advisor', 'investment account', 'emergency fund'],
            personalValues: ['security', 'independence', 'future planning', 'responsibility']
        }]
    ]);

    async generateSpecific(intent: GoalIntent): Promise<GeneratedSMARTComponent<string>> {
        try {
            // Validate input
            if (!intent || !intent.action || !intent.outcome || !intent.domain ||
                intent.action.trim() === '' || intent.outcome.trim() === '') {
                throw AIGoalPlanningUtils.createException(
                    AIGoalPlanningError.VALIDATION_FAILED,
                    'Invalid goal intent: missing required fields',
                    ['Ensure goal intent contains domain, action, and outcome'],
                    true
                );
            }

            const domainInfo = this.domainTemplates.get(intent.domain);
            let specific: string;
            let confidence: ConfidenceLevel;
            let reasoning: string;

            if (domainInfo && domainInfo.specificTemplates.length > 0) {
                // Use domain-specific template
                const template = domainInfo.specificTemplates[0];
                specific = template
                    .replace('{action}', intent.action)
                    .replace('{outcome}', intent.outcome);
                confidence = ConfidenceLevel.HIGH;
                reasoning = `Generated specific statement using ${intent.domain} domain template with action "${intent.action}" and outcome "${intent.outcome}"`;
            } else {
                // Use generic template
                specific = `Achieve ${intent.outcome} by consistently ${intent.action} with measurable progress tracking`;
                confidence = ConfidenceLevel.MEDIUM;
                reasoning = `Generated generic specific statement as no domain-specific template available for ${intent.domain}`;
            }

            // Enhance specificity based on context
            if (intent.context && intent.context.length > 0) {
                const contextPhrase = intent.context[0];
                specific += ` in order to ${contextPhrase}`;
                confidence = this.increaseConfidence(confidence);
                reasoning += `. Enhanced with context: "${contextPhrase}"`;
            }

            return {
                content: specific,
                confidence,
                reasoning
            };
        } catch (error) {
            if (error && typeof error === 'object' && 'type' in error) {
                throw error; // Re-throw AI planning exceptions
            }
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.VALIDATION_FAILED,
                'Failed to generate specific criteria',
                ['Ensure goal intent contains clear action and outcome'],
                true,
                error as Error
            );
        }
    }

    async generateMeasurable(intent: GoalIntent, description: string): Promise<GeneratedSMARTComponent<MeasurableMetric[]>> {
        try {
            const metrics: MeasurableMetric[] = [];
            let confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM;
            let reasoning = 'Generated measurable metrics based on goal intent and description';

            // Extract explicit metrics from description
            const explicitMetrics = this.extractMetricsFromDescription(description);
            metrics.push(...explicitMetrics);

            // Add domain-specific metrics if none found
            if (metrics.length === 0) {
                const domainMetrics = this.generateDomainSpecificMetrics(intent);
                metrics.push(...domainMetrics);
                confidence = ConfidenceLevel.MEDIUM;
                reasoning += '. Used domain-specific default metrics as no explicit metrics found';
            } else {
                confidence = ConfidenceLevel.HIGH;
                reasoning += '. Used explicit metrics from description';
            }

            // Ensure at least one metric exists
            if (metrics.length === 0) {
                metrics.push({
                    name: 'completion_progress',
                    unit: 'percent',
                    targetValue: 100,
                    currentValue: 0
                });
                confidence = ConfidenceLevel.LOW;
                reasoning += '. Added default completion metric as fallback';
            }

            return {
                content: metrics,
                confidence,
                reasoning
            };
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.UNMEASURABLE_GOAL,
                'Failed to generate measurable criteria',
                ['Include specific numbers or quantities in your goal description'],
                true,
                error as Error
            );
        }
    }

    async generateAchievable(intent: GoalIntent, timeframe: TimeframeInfo): Promise<GeneratedSMARTComponent<AchievabilityAssessment>> {
        try {
            const assessment = this.assessGoalAchievability(intent, timeframe);
            const confidence = this.calculateAchievabilityConfidence(intent, timeframe);
            const reasoning = this.generateAchievabilityReasoning(assessment, intent, timeframe);

            return {
                content: assessment,
                confidence,
                reasoning
            };
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.VALIDATION_FAILED,
                'Failed to generate achievability assessment',
                ['Provide more details about timeline and resources'],
                true,
                error as Error
            );
        }
    }

    async generateRelevant(intent: GoalIntent, userId: string): Promise<GeneratedSMARTComponent<RelevanceContext>> {
        try {
            const domainInfo = this.domainTemplates.get(intent.domain);
            const personalValues = domainInfo?.personalValues || ['personal growth', 'self-improvement'];

            // Add context-based values
            const contextValues = this.extractValuesFromContext(intent.context);
            const allValues = [...new Set([...personalValues, ...contextValues])];

            const relevanceContext: RelevanceContext = {
                personalValues: allValues,
                lifeAreas: [intent.domain],
                motivation: this.generateMotivationStatement(intent)
            };

            const confidence = intent.context.length > 0 ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM;
            const reasoning = `Generated relevance context for ${intent.domain} domain with ${allValues.length} personal values` +
                (intent.context.length > 0 ? ` and motivation derived from provided context` : '');

            return {
                content: relevanceContext,
                confidence,
                reasoning
            };
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.VALIDATION_FAILED,
                'Failed to generate relevance criteria',
                ['Provide more context about why this goal matters to you'],
                true,
                error as Error
            );
        }
    }

    async generateTimeBound(timeframe: TimeframeInfo, intent: GoalIntent): Promise<GeneratedSMARTComponent<TimeConstraint>> {
        try {
            const timeConstraint = this.createTimeConstraint(timeframe, intent);
            const confidence = this.calculateTimeConstraintConfidence(timeframe);
            const reasoning = this.generateTimeConstraintReasoning(timeframe, timeConstraint);

            return {
                content: timeConstraint,
                confidence,
                reasoning
            };
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.UNREALISTIC_TIMEFRAME,
                'Failed to generate time-bound criteria',
                ['Specify a clear timeline or deadline for your goal'],
                true,
                error as Error
            );
        }
    }

    private extractMetricsFromDescription(description: string): MeasurableMetric[] {
        const metrics: MeasurableMetric[] = [];
        const lowerDescription = description.toLowerCase();

        // Look for dollar amounts
        const dollarMatches = description.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
        if (dollarMatches) {
            for (const match of dollarMatches) {
                const value = parseFloat(match.substring(1).replace(/,/g, ''));
                metrics.push({
                    name: 'target_amount',
                    unit: 'dollars',
                    targetValue: value,
                    currentValue: 0
                });
            }
        }

        // Look for weight amounts
        const weightMatches = description.match(/(\d+(?:\.\d+)?)\s*(pounds?|lbs?|kg|kilograms?)/gi);
        if (weightMatches) {
            for (const match of weightMatches) {
                const parts = match.match(/(\d+(?:\.\d+)?)\s*(pounds?|lbs?|kg|kilograms?)/i);
                if (parts) {
                    const value = parseFloat(parts[1]);
                    const unit = parts[2].toLowerCase().startsWith('k') ? 'kg' : 'pounds';
                    metrics.push({
                        name: 'weight_target',
                        unit,
                        targetValue: value,
                        currentValue: 0
                    });
                }
            }
        }

        // Look for time-based metrics
        const timeMatches = description.match(/(\d+)\s*(hours?|minutes?)\s*(daily|per day|each day)/gi);
        if (timeMatches) {
            for (const match of timeMatches) {
                const parts = match.match(/(\d+)\s*(hours?|minutes?)/i);
                if (parts) {
                    const value = parseFloat(parts[1]);
                    const unit = parts[2].toLowerCase().startsWith('h') ? 'hours' : 'minutes';
                    metrics.push({
                        name: 'daily_time',
                        unit,
                        targetValue: value,
                        currentValue: 0
                    });
                }
            }
        }

        return metrics;
    }

    private generateDomainSpecificMetrics(intent: GoalIntent): MeasurableMetric[] {
        const domainInfo = this.domainTemplates.get(intent.domain);
        if (!domainInfo) {
            return [];
        }

        return domainInfo.commonMetrics.map(metric => ({
            name: metric.name,
            unit: metric.unit,
            targetValue: metric.defaultTarget,
            currentValue: 0
        }));
    }

    private assessGoalAchievability(intent: GoalIntent, timeframe: TimeframeInfo): AchievabilityAssessment {
        const difficultyLevel = this.calculateDifficultyLevel(intent, timeframe);
        const requiredResources = this.identifyRequiredResources(intent);
        const estimatedEffort = this.estimateEffort(intent, timeframe);

        return {
            difficultyLevel,
            requiredResources,
            estimatedEffort
        };
    }

    private calculateDifficultyLevel(intent: GoalIntent, timeframe: TimeframeInfo): 'easy' | 'moderate' | 'challenging' | 'difficult' {
        let difficultyScore = 0;

        // Factor in urgency
        if (intent.urgency === UrgencyLevel.HIGH) difficultyScore += 2;
        else if (intent.urgency === UrgencyLevel.MEDIUM) difficultyScore += 1;

        // Factor in timeframe
        if (timeframe.endDate) {
            const timeToComplete = timeframe.endDate.getTime() - Date.now();
            const daysToComplete = timeToComplete / (1000 * 60 * 60 * 24);

            if (daysToComplete < 30) difficultyScore += 2;
            else if (daysToComplete < 90) difficultyScore += 1;
        }

        // Factor in domain complexity
        const complexDomains = [LifeDomain.CAREER, LifeDomain.FINANCE, LifeDomain.LEARNING];
        if (complexDomains.includes(intent.domain)) difficultyScore += 1;

        if (difficultyScore >= 4) return 'difficult';
        if (difficultyScore >= 3) return 'challenging';
        if (difficultyScore >= 1) return 'moderate';
        return 'easy';
    }

    private identifyRequiredResources(intent: GoalIntent): string[] {
        const domainInfo = this.domainTemplates.get(intent.domain);
        const baseResources = domainInfo?.typicalResources || ['time', 'commitment'];

        // Add context-specific resources
        const contextResources: string[] = [];
        for (const context of intent.context) {
            if (context.includes('budget')) contextResources.push('financial planning');
            if (context.includes('equipment')) contextResources.push('specialized equipment');
            if (context.includes('help') || context.includes('support')) contextResources.push('external support');
        }

        return [...new Set([...baseResources, ...contextResources])];
    }

    private estimateEffort(intent: GoalIntent, timeframe: TimeframeInfo): Duration {
        // Base effort estimation
        let baseHours = 20; // Default 20 hours

        // Adjust based on domain
        const effortMultipliers: Record<LifeDomain, number> = {
            [LifeDomain.FITNESS]: 1.5,
            [LifeDomain.LEARNING]: 2.0,
            [LifeDomain.CAREER]: 2.5,
            [LifeDomain.FINANCE]: 1.0,
            [LifeDomain.NUTRITION]: 1.2,
            [LifeDomain.HEALTH]: 1.3,
            [LifeDomain.SLEEP]: 0.8,
            [LifeDomain.HABITS]: 1.0,
            [LifeDomain.SOCIAL]: 1.2,
            [LifeDomain.PROJECTS]: 2.0,
            [LifeDomain.PERSONAL]: 1.5
        };

        baseHours *= effortMultipliers[intent.domain] || 1.0;

        // Adjust based on urgency
        if (intent.urgency === UrgencyLevel.HIGH) baseHours *= 1.5;
        else if (intent.urgency === UrgencyLevel.LOW) baseHours *= 0.8;

        // Convert to duration with days and weeks
        const days = Math.ceil(baseHours / 8); // Assuming 8 hours per day
        const weeks = Math.ceil(days / 7);

        return {
            hours: Math.round(baseHours),
            days,
            weeks
        };
    }

    private calculateAchievabilityConfidence(intent: GoalIntent, timeframe: TimeframeInfo): ConfidenceLevel {
        let confidenceScore = 0.5; // Start with medium confidence

        // Increase confidence if we have clear timeframe
        if (timeframe.endDate) confidenceScore += 0.2;
        if (timeframe.duration) confidenceScore += 0.1;

        // Adjust based on domain familiarity
        if (this.domainTemplates.has(intent.domain)) confidenceScore += 0.1;

        // Adjust based on context richness
        if (intent.context.length > 0) confidenceScore += 0.1;

        return AIGoalPlanningUtils.scoreToConfidence(confidenceScore);
    }

    private generateAchievabilityReasoning(assessment: AchievabilityAssessment, intent: GoalIntent, timeframe: TimeframeInfo): string {
        let reasoning = `Assessed as ${assessment.difficultyLevel} difficulty based on `;

        const factors: string[] = [];
        factors.push(`${intent.domain} domain complexity`);
        factors.push(`${intent.urgency} urgency level`);

        if (timeframe.endDate) {
            const daysToComplete = Math.ceil((timeframe.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            factors.push(`${daysToComplete} days timeline`);
        }

        reasoning += factors.join(', ');
        reasoning += `. Estimated effort: ${assessment.estimatedEffort.hours} hours`;
        reasoning += `. Required resources: ${assessment.requiredResources.join(', ')}`;

        return reasoning;
    }

    private extractValuesFromContext(context: string[]): string[] {
        const values: string[] = [];

        for (const contextItem of context) {
            const lowerContext = contextItem.toLowerCase();
            if (lowerContext.includes('health')) values.push('health');
            if (lowerContext.includes('family')) values.push('family');
            if (lowerContext.includes('career')) values.push('career advancement');
            if (lowerContext.includes('money') || lowerContext.includes('financial') || lowerContext.includes('security')) values.push('financial security');
            if (lowerContext.includes('confident') || lowerContext.includes('confidence')) values.push('self-confidence');
            if (lowerContext.includes('energy')) values.push('vitality');
        }

        return values;
    }

    private generateMotivationStatement(intent: GoalIntent): string {
        if (intent.context.length > 0) {
            return `Motivated by: ${intent.context.join(', ')}`;
        }

        // Generate default motivation based on domain
        const domainMotivations: Record<LifeDomain, string> = {
            [LifeDomain.FITNESS]: 'improving physical health and well-being',
            [LifeDomain.LEARNING]: 'personal growth and skill development',
            [LifeDomain.CAREER]: 'professional advancement and success',
            [LifeDomain.FINANCE]: 'financial security and independence',
            [LifeDomain.NUTRITION]: 'better health through improved eating habits',
            [LifeDomain.HEALTH]: 'overall wellness and quality of life',
            [LifeDomain.SLEEP]: 'better rest and energy levels',
            [LifeDomain.HABITS]: 'building positive life patterns',
            [LifeDomain.SOCIAL]: 'stronger relationships and connections',
            [LifeDomain.PROJECTS]: 'personal accomplishment and creativity',
            [LifeDomain.PERSONAL]: 'personal development and self-improvement'
        };

        return domainMotivations[intent.domain] || 'personal improvement and goal achievement';
    }

    private createTimeConstraint(timeframe: TimeframeInfo, intent: GoalIntent): TimeConstraint {
        const now = new Date();
        let startDate = timeframe.startDate || now;
        let endDate = timeframe.endDate;

        // Generate end date if not provided
        if (!endDate) {
            if (timeframe.duration) {
                endDate = new Date(startDate.getTime() + (timeframe.duration.hours * 60 * 60 * 1000));
            } else {
                // Default timeline based on domain and urgency
                const defaultDays = this.getDefaultTimelineDays(intent);
                endDate = new Date(startDate.getTime() + (defaultDays * 24 * 60 * 60 * 1000));
            }
        }

        // Generate milestones
        const milestones = this.generateMilestones(startDate, endDate, timeframe.milestones);

        return {
            startDate,
            endDate,
            milestones
        };
    }

    private getDefaultTimelineDays(intent: GoalIntent): number {
        const domainDefaults: Record<LifeDomain, number> = {
            [LifeDomain.FITNESS]: 90,      // 3 months
            [LifeDomain.LEARNING]: 120,    // 4 months
            [LifeDomain.CAREER]: 180,      // 6 months
            [LifeDomain.FINANCE]: 365,     // 1 year
            [LifeDomain.NUTRITION]: 60,    // 2 months
            [LifeDomain.HEALTH]: 90,       // 3 months
            [LifeDomain.SLEEP]: 30,        // 1 month
            [LifeDomain.HABITS]: 66,       // ~2 months (habit formation)
            [LifeDomain.SOCIAL]: 90,       // 3 months
            [LifeDomain.PROJECTS]: 120,    // 4 months
            [LifeDomain.PERSONAL]: 90      // 3 months
        };

        let baseDays = domainDefaults[intent.domain] || 90;

        // Adjust based on urgency
        if (intent.urgency === UrgencyLevel.HIGH) baseDays = Math.floor(baseDays * 0.7);
        else if (intent.urgency === UrgencyLevel.LOW) baseDays = Math.floor(baseDays * 1.3);

        return baseDays;
    }

    private generateMilestones(startDate: Date, endDate: Date, existingMilestones: string[]): Date[] {
        const milestones: Date[] = [];
        const totalDuration = endDate.getTime() - startDate.getTime();

        // If we have existing milestone descriptions, create dates for them
        if (existingMilestones.length > 0) {
            const interval = totalDuration / (existingMilestones.length + 1);
            for (let i = 1; i <= existingMilestones.length; i++) {
                milestones.push(new Date(startDate.getTime() + (interval * i)));
            }
        } else {
            // Generate default milestones (25%, 50%, 75% completion)
            milestones.push(new Date(startDate.getTime() + (totalDuration * 0.25)));
            milestones.push(new Date(startDate.getTime() + (totalDuration * 0.5)));
            milestones.push(new Date(startDate.getTime() + (totalDuration * 0.75)));
        }

        return milestones;
    }

    private calculateTimeConstraintConfidence(timeframe: TimeframeInfo): ConfidenceLevel {
        let confidenceScore = 0.3; // Start with low-medium confidence

        if (timeframe.startDate) confidenceScore += 0.2;
        if (timeframe.endDate) confidenceScore += 0.3;
        if (timeframe.duration) confidenceScore += 0.2;
        if (timeframe.milestones.length > 0) confidenceScore += 0.1;
        if (timeframe.extractedPhrases.length > 0) confidenceScore += 0.1;

        return AIGoalPlanningUtils.scoreToConfidence(confidenceScore);
    }

    private generateTimeConstraintReasoning(timeframe: TimeframeInfo, constraint: TimeConstraint): string {
        let reasoning = 'Generated time constraint with ';

        const components: string[] = [];
        if (timeframe.startDate) components.push('explicit start date');
        else components.push('current date as start');

        if (timeframe.endDate) components.push('explicit end date');
        else if (timeframe.duration) components.push('duration-based end date');
        else components.push('domain-appropriate default timeline');

        components.push(`${constraint.milestones.length} milestone dates`);

        reasoning += components.join(', ');

        if (timeframe.extractedPhrases.length > 0) {
            reasoning += `. Based on time phrases: ${timeframe.extractedPhrases.join(', ')}`;
        }

        return reasoning;
    }

    private increaseConfidence(current: ConfidenceLevel): ConfidenceLevel {
        const currentScore = AIGoalPlanningUtils.confidenceToScore(current);
        const newScore = Math.min(0.9, currentScore + 0.1); // Cap at VERY_HIGH
        return AIGoalPlanningUtils.scoreToConfidence(newScore);
    }
}