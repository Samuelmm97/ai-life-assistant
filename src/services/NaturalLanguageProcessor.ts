import {
    NaturalLanguageProcessor,
    GoalIntent,
    TimeframeInfo,
    MetricSuggestion,
    ConstraintInfo,
    LifeDomain,
    UrgencyLevel,
    TimeframeFlexibility,
    ConfidenceLevel,
    Duration,
    AIGoalPlanningError,
    AIGoalPlanningException
} from '../types';
import { AIGoalPlanningUtils } from '../types/ai-goal-planning-utils';

export class NaturalLanguageProcessorService implements NaturalLanguageProcessor {
    private readonly domainKeywords: Map<LifeDomain, string[]> = new Map([
        [LifeDomain.FITNESS, ['workout', 'exercise', 'gym', 'run', 'fitness', 'strength', 'cardio', 'muscle', 'weight', 'training']],
        [LifeDomain.NUTRITION, ['eat', 'diet', 'nutrition', 'food', 'meal', 'calories', 'protein', 'healthy', 'cooking', 'weight loss']],
        [LifeDomain.FINANCE, ['money', 'save', 'budget', 'invest', 'financial', 'income', 'expense', 'debt', 'retirement', 'emergency fund']],
        [LifeDomain.LEARNING, ['learn', 'study', 'course', 'skill', 'education', 'book', 'knowledge', 'certification', 'language', 'practice']],
        [LifeDomain.HEALTH, ['health', 'doctor', 'medical', 'wellness', 'sleep', 'stress', 'mental health', 'therapy', 'medication']],
        [LifeDomain.SLEEP, ['sleep', 'rest', 'bedtime', 'wake up', 'insomnia', 'tired', 'energy', 'nap', 'schedule']],
        [LifeDomain.HABITS, ['habit', 'routine', 'daily', 'consistency', 'practice', 'discipline', 'behavior', 'change']],
        [LifeDomain.CAREER, ['job', 'work', 'career', 'promotion', 'salary', 'professional', 'networking', 'skills', 'resume']],
        [LifeDomain.SOCIAL, ['friends', 'family', 'relationship', 'social', 'community', 'networking', 'communication', 'dating']],
        [LifeDomain.PROJECTS, ['project', 'build', 'create', 'develop', 'complete', 'finish', 'accomplish', 'task', 'goal']]
    ]);

    private readonly actionVerbs = [
        'achieve', 'complete', 'finish', 'build', 'create', 'develop', 'learn', 'master',
        'improve', 'increase', 'decrease', 'reduce', 'gain', 'lose', 'save', 'earn',
        'start', 'begin', 'establish', 'maintain', 'practice', 'exercise', 'study'
    ];

    private readonly timeKeywords = {
        relative: ['today', 'tomorrow', 'next week', 'next month', 'this year', 'by summer', 'by winter'],
        duration: ['days?', 'weeks?', 'months?', 'years?', 'hours?', 'minutes?'],
        specific: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    };

    private readonly metricKeywords = {
        weight: ['pounds', 'lbs', 'kg', 'kilograms', 'weight'],
        distance: ['miles', 'kilometers', 'km', 'steps', 'meters'],
        time: ['minutes', 'hours', 'days', 'weeks', 'months'],
        money: ['dollars', '$', 'usd', 'budget', 'cost', 'price'],
        count: ['times', 'reps', 'sets', 'pages', 'books', 'courses'],
        percentage: ['%', 'percent', 'percentage']
    };

    async extractIntent(description: string): Promise<GoalIntent> {
        try {
            if (!description || typeof description !== 'string' || description.trim().length < 3) {
                throw AIGoalPlanningUtils.createException(
                    AIGoalPlanningError.INSUFFICIENT_DESCRIPTION,
                    'Description is too short to extract meaningful intent',
                    ['Please provide a more detailed description of your goal', 'Include what you want to achieve and why']
                );
            }

            const cleanDescription = description.toLowerCase().trim();

            // Extract domain
            const domain = this.identifyDomain(cleanDescription);

            // Extract action
            const action = this.extractAction(cleanDescription);

            // Extract outcome
            const outcome = this.extractOutcome(cleanDescription, action);

            // Extract context
            const context = this.extractContext(cleanDescription);

            // Determine urgency
            const urgency = AIGoalPlanningUtils.inferUrgencyFromText(cleanDescription);

            return {
                domain,
                action,
                outcome,
                context,
                urgency
            };
        } catch (error) {
            if (error && typeof error === 'object' && 'type' in error) {
                throw error; // Re-throw AI planning exceptions
            }
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.AMBIGUOUS_INTENT,
                'Failed to extract clear intent from description',
                ['Try rephrasing your goal more clearly', 'Include specific actions and outcomes'],
                true,
                error as Error
            );
        }
    }

    async parseTimeframes(description: string): Promise<TimeframeInfo> {
        try {
            const cleanDescription = description.toLowerCase().trim();

            // Extract dates and durations
            const { startDate, endDate } = this.extractDates(cleanDescription);
            const duration = this.extractDuration(cleanDescription);
            const milestones = this.extractMilestones(cleanDescription);
            const flexibility = AIGoalPlanningUtils.inferFlexibilityFromText(cleanDescription);
            const extractedPhrases = this.extractTimeRelatedPhrases(cleanDescription);

            return {
                startDate,
                endDate,
                duration,
                milestones,
                flexibility,
                extractedPhrases
            };
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.UNREALISTIC_TIMEFRAME,
                'Failed to parse timeframe information from description',
                ['Include specific dates or time periods', 'Use clear time expressions like "in 3 months" or "by December"'],
                true,
                error as Error
            );
        }
    }

    async identifyMetrics(description: string): Promise<MetricSuggestion[]> {
        try {
            const cleanDescription = description.toLowerCase().trim();
            const metrics: MetricSuggestion[] = [];

            // Look for explicit numbers and units
            const explicitMetrics = this.extractExplicitMetrics(cleanDescription);
            metrics.push(...explicitMetrics);

            // Suggest implicit metrics based on domain and action
            const implicitMetrics = this.suggestImplicitMetrics(cleanDescription);
            metrics.push(...implicitMetrics);

            if (metrics.length === 0) {
                // Provide default metrics based on common goal patterns
                const defaultMetrics = this.generateDefaultMetrics(cleanDescription);
                metrics.push(...defaultMetrics);
            }

            return metrics;
        } catch (error) {
            throw AIGoalPlanningUtils.createException(
                AIGoalPlanningError.UNMEASURABLE_GOAL,
                'Could not identify measurable components in the goal description',
                ['Include specific numbers or quantities', 'Mention what success looks like in measurable terms'],
                true,
                error as Error
            );
        }
    }

    async extractConstraints(description: string): Promise<ConstraintInfo> {
        try {
            const cleanDescription = description.toLowerCase().trim();

            const timeConstraints = this.extractTimeConstraints(cleanDescription);
            const resourceConstraints = this.extractResourceConstraints(cleanDescription);
            const personalConstraints = this.extractPersonalConstraints(cleanDescription);
            const preferences = this.extractPreferences(cleanDescription);

            return {
                timeConstraints,
                resourceConstraints,
                personalConstraints,
                preferences
            };
        } catch (error) {
            // Constraints are optional, so we return empty arrays rather than throwing
            return {
                timeConstraints: [],
                resourceConstraints: [],
                personalConstraints: [],
                preferences: []
            };
        }
    }

    private identifyDomain(description: string): LifeDomain {
        const domainScores = new Map<LifeDomain, number>();

        // Initialize scores
        for (const domain of Object.values(LifeDomain)) {
            domainScores.set(domain, 0);
        }

        // Score based on keyword matches
        for (const [domain, keywords] of this.domainKeywords) {
            for (const keyword of keywords) {
                if (description.includes(keyword)) {
                    domainScores.set(domain, (domainScores.get(domain) || 0) + 1);
                }
            }
        }

        // Special handling for weight loss - prioritize fitness over nutrition
        if (description.includes('lose') && description.includes('weight')) {
            domainScores.set(LifeDomain.FITNESS, (domainScores.get(LifeDomain.FITNESS) || 0) + 3);
        }

        // Special handling for workout/exercise - prioritize fitness
        if (description.includes('workout') || description.includes('exercise') || description.includes('working out')) {
            domainScores.set(LifeDomain.FITNESS, (domainScores.get(LifeDomain.FITNESS) || 0) + 2);
        }

        // Find the domain with the highest score
        let bestDomain = LifeDomain.PROJECTS; // Default
        let bestScore = 0;

        for (const [domain, score] of domainScores) {
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domain;
            }
        }

        return bestDomain;
    }

    private extractAction(description: string): string {
        // Look for action verbs
        for (const verb of this.actionVerbs) {
            if (description.includes(verb)) {
                return verb;
            }
        }

        // If no explicit action verb found, infer from context
        if (description.includes('want to') || description.includes('need to')) {
            const match = description.match(/(?:want to|need to)\s+(\w+)/);
            if (match) return match[1];
        }

        // Default action based on common patterns
        if (description.includes('more') || description.includes('better')) {
            return 'improve';
        }
        if (description.includes('new') || description.includes('start')) {
            return 'start';
        }

        return 'achieve'; // Default action
    }

    private extractOutcome(description: string, action: string): string {
        // Store original description for case preservation
        const originalDescription = description;
        const lowerDescription = description.toLowerCase();

        // Try to find what comes after the action
        const actionIndex = lowerDescription.indexOf(action);
        if (actionIndex !== -1) {
            const afterActionOriginal = originalDescription.substring(actionIndex + action.length).trim();
            // Take the first meaningful phrase after the action
            const words = afterActionOriginal.split(' ').slice(0, 5); // Limit to first 5 words
            const outcome = words.join(' ').replace(/[^\w\s]/g, '').trim();
            return outcome;
        }

        // Fallback: extract key nouns from the description
        const words = originalDescription.split(' ');
        const meaningfulWords = words.filter(word =>
            word.length > 3 &&
            !['want', 'need', 'like', 'would', 'could', 'should'].includes(word.toLowerCase())
        );

        return meaningfulWords.slice(0, 3).join(' ') || 'goal completion';
    }

    private extractContext(description: string): string[] {
        const context: string[] = [];

        // Look for contextual phrases (case insensitive)
        const contextPatterns = [
            /because\s+(.+?)(?:\.|$)/gi,
            /so that\s+(.+?)(?:\.|$)/gi,
            /in order to\s+(.+?)(?:\.|$)/gi,
            /for\s+(.+?)(?:\.|$)/gi
        ];

        for (const pattern of contextPatterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    context.push(match[1].trim());
                }
            }
        }

        // Add any mentioned constraints or preferences as context
        const lowerDescription = description.toLowerCase();
        if (lowerDescription.includes('budget')) context.push('budget-conscious');
        if (lowerDescription.includes('busy') || lowerDescription.includes('time')) context.push('time-constrained');
        if (lowerDescription.includes('beginner')) context.push('beginner-level');
        if (lowerDescription.includes('advanced')) context.push('advanced-level');

        return context;
    }

    private extractDates(description: string): { startDate: Date | null; endDate: Date | null } {
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        const now = new Date();

        // Look for relative dates
        if (description.includes('next week')) {
            endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (description.includes('next month')) {
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        } else if (description.includes('next year')) {
            endDate = new Date(now.getFullYear() + 1, 11, 31);
        } else if (description.includes('this year')) {
            endDate = new Date(now.getFullYear(), 11, 31);
        } else if (description.includes('by summer')) {
            endDate = new Date(now.getFullYear(), 5, 21); // June 21st
        }

        // Look for duration-based dates
        const durationMatch = description.match(/in\s+(\d+)\s+(days?|weeks?|months?|years?)/);
        if (durationMatch) {
            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2];

            if (unit.startsWith('day')) {
                endDate = new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
            } else if (unit.startsWith('week')) {
                endDate = new Date(now.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
            } else if (unit.startsWith('month')) {
                endDate = new Date(now.getFullYear(), now.getMonth() + amount, now.getDate());
            } else if (unit.startsWith('year')) {
                endDate = new Date(now.getFullYear() + amount, now.getMonth(), now.getDate());
            }
        }

        // Default start date to now if we have an end date
        if (endDate && !startDate) {
            startDate = now;
        }

        return { startDate, endDate };
    }

    private extractDuration(description: string): Duration | null {
        // Look for patterns like "for X weeks/months" first (total duration takes priority)
        const totalDurationMatch = description.match(/for\s+(\d+)\s+(weeks?|months?|days?)/);
        if (totalDurationMatch) {
            const amount = parseInt(totalDurationMatch[1]);
            const unit = totalDurationMatch[2];

            if (unit.startsWith('week')) {
                return { hours: amount * 24 * 7, days: amount * 7, weeks: amount };
            } else if (unit.startsWith('month')) {
                return { hours: amount * 24 * 30, days: amount * 30, weeks: amount * 4 };
            } else if (unit.startsWith('day')) {
                return { hours: amount * 24, days: amount };
            }
        }

        // Look for daily patterns (e.g., "2 hours daily", "spending 2 hours daily")
        const dailyMatch = description.match(/(?:spending\s+)?(\d+)\s+(hours?|minutes?)\s+daily/);
        if (dailyMatch) {
            const amount = parseInt(dailyMatch[1]);
            const unit = dailyMatch[2];

            if (unit.startsWith('hour')) {
                return { hours: amount };
            } else if (unit.startsWith('minute')) {
                return { hours: amount / 60 };
            }
        }

        // Fallback to simple duration patterns
        const durationMatch = description.match(/(\d+)\s+(hours?|days?|weeks?|months?)/);
        if (durationMatch) {
            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2];

            if (unit.startsWith('hour')) {
                return { hours: amount };
            } else if (unit.startsWith('day')) {
                return { hours: amount * 24, days: amount };
            } else if (unit.startsWith('week')) {
                return { hours: amount * 24 * 7, days: amount * 7, weeks: amount };
            }
        }

        return null;
    }

    private extractMilestones(description: string): string[] {
        const milestones: string[] = [];

        // Look for milestone indicators (case insensitive)
        const milestonePatterns = [
            /first\s+(.+?)(?:\s+then|\s+and|,|$)/gi,
            /then\s+(.+?)(?:\s+and|,|$)/gi,
            /step\s+\d+[:\s]+(.+?)(?:\s+step|\s+and|,|$)/gi
        ];

        for (const pattern of milestonePatterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    milestones.push(match[1].trim().replace(/,$/, ''));
                }
            }
        }

        return milestones;
    }

    private extractTimeRelatedPhrases(description: string): string[] {
        const phrases: string[] = [];

        // Extract time-related phrases
        const timePatterns = [
            /by\s+\w+/g,
            /in\s+\d+\s+\w+/g,
            /within\s+\d+\s+\w+/g,
            /over\s+the\s+next\s+\w+/g,
            /next\s+\w+/g
        ];

        for (const pattern of timePatterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                phrases.push(match[0]);
            }
        }

        return phrases;
    }

    private extractExplicitMetrics(description: string): MetricSuggestion[] {
        const metrics: MetricSuggestion[] = [];

        // Look for dollar amounts first
        const dollarPattern = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
        const dollarMatches = description.matchAll(dollarPattern);
        for (const match of dollarMatches) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            metrics.push({
                name: 'money',
                unit: '$',
                targetValue: value,
                confidence: ConfidenceLevel.HIGH,
                reasoning: `Extracted dollar amount: $${value} from description`
            });
        }

        // Look for number + unit patterns
        const metricPattern = /(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)/g;
        const matches = description.matchAll(metricPattern);

        for (const match of matches) {
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();

            // Skip if we already found this as a dollar amount
            if (metrics.some(m => m.targetValue === value && m.unit === '$')) {
                continue;
            }

            // Determine metric type and name
            let name = 'target';
            let confidence = ConfidenceLevel.HIGH;

            for (const [type, keywords] of Object.entries(this.metricKeywords)) {
                if (keywords.some(keyword => unit.includes(keyword) || description.includes(keyword))) {
                    name = type;
                    break;
                }
            }

            metrics.push({
                name,
                unit,
                targetValue: value,
                confidence,
                reasoning: `Extracted explicit metric: ${value} ${unit} from description`
            });
        }

        return metrics;
    }

    private suggestImplicitMetrics(description: string): MetricSuggestion[] {
        const metrics: MetricSuggestion[] = [];

        // Suggest metrics based on common goal patterns
        if (description.includes('lose weight') || description.includes('weight loss')) {
            metrics.push({
                name: 'weight_loss',
                unit: 'pounds',
                targetValue: 10,
                confidence: ConfidenceLevel.MEDIUM,
                reasoning: 'Suggested weight loss target based on goal description'
            });
        }

        if (description.includes('save money') || description.includes('savings')) {
            metrics.push({
                name: 'savings',
                unit: 'dollars',
                targetValue: 1000,
                confidence: ConfidenceLevel.MEDIUM,
                reasoning: 'Suggested savings target based on goal description'
            });
        }

        if (description.includes('read') && description.includes('book')) {
            metrics.push({
                name: 'books_read',
                unit: 'books',
                targetValue: 12,
                confidence: ConfidenceLevel.MEDIUM,
                reasoning: 'Suggested reading target based on goal description'
            });
        }

        return metrics;
    }

    private generateDefaultMetrics(description: string): MetricSuggestion[] {
        // Provide a generic completion metric if no specific metrics can be identified
        return [{
            name: 'completion',
            unit: 'percent',
            targetValue: 100,
            confidence: ConfidenceLevel.LOW,
            reasoning: 'Default completion metric when no specific metrics could be identified'
        }];
    }

    private extractTimeConstraints(description: string): string[] {
        const constraints: string[] = [];

        if (description.includes('deadline') || description.includes('must be done by')) {
            constraints.push('strict deadline');
        }
        if (description.includes('weekends only') || description.includes('evenings only') ||
            description.includes('can only work weekends')) {
            constraints.push('limited time availability');
        }
        if (description.includes('busy schedule')) {
            constraints.push('time-constrained');
        }

        return constraints;
    }

    private extractResourceConstraints(description: string): string[] {
        const constraints: string[] = [];

        if (description.includes('budget') || description.includes('cheap') || description.includes('free')) {
            constraints.push('budget limitations');
        }
        if (description.includes('no gym') || description.includes('at home')) {
            constraints.push('location constraints');
        }
        if (description.includes('no equipment')) {
            constraints.push('equipment limitations');
        }

        return constraints;
    }

    private extractPersonalConstraints(description: string): string[] {
        const constraints: string[] = [];

        if (description.includes('beginner') || description.includes('new to')) {
            constraints.push('beginner level');
        }
        if (description.includes('injury') || description.includes('health condition')) {
            constraints.push('health limitations');
        }
        if (description.includes('busy') || description.includes('limited time')) {
            constraints.push('time limitations');
        }

        return constraints;
    }

    private extractPreferences(description: string): string[] {
        const preferences: string[] = [];

        if (description.includes('prefer') || description.includes('like to')) {
            const preferenceMatch = description.match(/prefer\s+(.+?)(?:\s+but|\s+and|$)/);
            if (preferenceMatch) {
                preferences.push(preferenceMatch[1].trim());
            }
        }

        if (description.includes('morning')) preferences.push('morning schedule');
        if (description.includes('evening')) preferences.push('evening schedule');
        if (description.includes('gradual') || description.includes('slowly')) preferences.push('gradual progress');
        if (description.includes('aggressive') || description.includes('quickly')) preferences.push('aggressive timeline');

        return preferences;
    }
}