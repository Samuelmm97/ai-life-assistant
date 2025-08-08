import { NaturalLanguageProcessorService } from '../services/NaturalLanguageProcessor';
import {
    LifeDomain,
    UrgencyLevel,
    TimeframeFlexibility,
    ConfidenceLevel,
    AIGoalPlanningError
} from '../types';

describe('NaturalLanguageProcessorService', () => {
    let processor: NaturalLanguageProcessorService;

    beforeEach(() => {
        processor = new NaturalLanguageProcessorService();
    });

    describe('extractIntent', () => {
        it('should extract fitness domain from workout description', async () => {
            const description = 'I want to start working out at the gym 3 times a week';
            const intent = await processor.extractIntent(description);

            expect(intent.domain).toBe(LifeDomain.FITNESS);
            expect(intent.action).toBe('start');
            expect(intent.outcome).toContain('working out');
            expect(intent.urgency).toBe(UrgencyLevel.LOW);
        });

        it('should extract learning domain from education description', async () => {
            const description = 'I need to learn Python programming for my career';
            const intent = await processor.extractIntent(description);

            expect(intent.domain).toBe(LifeDomain.LEARNING);
            expect(intent.action).toBe('learn');
            expect(intent.outcome.toLowerCase()).toContain('python');
            expect(intent.context).toContain('my career');
        });

        it('should extract finance domain from savings description', async () => {
            const description = 'I want to save $5000 for an emergency fund';
            const intent = await processor.extractIntent(description);

            expect(intent.domain).toBe(LifeDomain.FINANCE);
            expect(intent.action).toBe('save');
            expect(intent.outcome).toContain('5000');
        });

        it('should detect high urgency from urgent keywords', async () => {
            const description = 'I urgently need to lose weight for my health';
            const intent = await processor.extractIntent(description);

            expect(intent.urgency).toBe(UrgencyLevel.HIGH);
            expect(intent.domain).toBe(LifeDomain.FITNESS);
        });

        it('should extract context from because/so that phrases', async () => {
            const description = 'I want to learn Spanish because I am moving to Mexico';
            const intent = await processor.extractIntent(description);

            expect(intent.context.some(c => c.toLowerCase().includes('moving to mexico'))).toBe(true);
            expect(intent.domain).toBe(LifeDomain.LEARNING);
        });

        it('should throw error for insufficient description', async () => {
            const description = 'go';

            await expect(processor.extractIntent(description)).rejects.toMatchObject({
                type: AIGoalPlanningError.INSUFFICIENT_DESCRIPTION
            });
        });

        it('should handle empty description', async () => {
            const description = '';

            await expect(processor.extractIntent(description)).rejects.toMatchObject({
                type: AIGoalPlanningError.INSUFFICIENT_DESCRIPTION
            });
        });

        it('should default to projects domain for unclear descriptions', async () => {
            const description = 'I want to accomplish something important';
            const intent = await processor.extractIntent(description);

            expect(intent.domain).toBe(LifeDomain.PROJECTS);
            expect(intent.action).toBe('accomplish');
        });
    });

    describe('parseTimeframes', () => {
        it('should parse relative timeframes like "next month"', async () => {
            const description = 'I want to complete this goal next month';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.endDate).toBeInstanceOf(Date);
            expect(timeframe.startDate).toBeInstanceOf(Date);
            expect(timeframe.flexibility).toBe(TimeframeFlexibility.FLEXIBLE);
            expect(timeframe.extractedPhrases).toContain('next month');
        });

        it('should parse duration-based timeframes like "in 3 months"', async () => {
            const description = 'I want to achieve this goal in 3 months';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.endDate).toBeInstanceOf(Date);
            expect(timeframe.startDate).toBeInstanceOf(Date);

            // Check that end date is approximately 3 months from now
            const now = new Date();
            const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
            const timeDiff = Math.abs(timeframe.endDate!.getTime() - expectedEnd.getTime());
            expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
        });

        it('should detect fixed flexibility from strict keywords', async () => {
            const description = 'I must complete this by the deadline exactly on time';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.flexibility).toBe(TimeframeFlexibility.FIXED);
        });

        it('should detect very flexible timeframes', async () => {
            const description = 'I want to eventually learn this skill whenever I have time';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.flexibility).toBe(TimeframeFlexibility.VERY_FLEXIBLE);
        });

        it('should extract milestones from step-by-step descriptions', async () => {
            const description = 'First I will learn basics, then practice daily, and finally take the test';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.milestones.some(m => m.toLowerCase().includes('learn basics'))).toBe(true);
            expect(timeframe.milestones).toContain('practice daily');
        });

        it('should handle descriptions without explicit timeframes', async () => {
            const description = 'I want to improve my skills';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.startDate).toBeNull();
            expect(timeframe.endDate).toBeNull();
            expect(timeframe.duration).toBeNull();
            expect(timeframe.flexibility).toBe(TimeframeFlexibility.FLEXIBLE);
        });

        it('should parse duration from hour/day/week patterns', async () => {
            const description = 'I want to spend 2 hours daily on this for 4 weeks';
            const timeframe = await processor.parseTimeframes(description);

            expect(timeframe.duration).toEqual({
                hours: 4 * 24 * 7,
                days: 4 * 7,
                weeks: 4
            });
        });
    });

    describe('identifyMetrics', () => {
        it('should extract explicit metrics with numbers and units', async () => {
            const description = 'I want to lose 15 pounds and run 5 miles';
            const metrics = await processor.identifyMetrics(description);

            expect(metrics).toHaveLength(2);

            const weightMetric = metrics.find(m => m.targetValue === 15);
            expect(weightMetric).toBeDefined();
            expect(weightMetric!.unit).toBe('pounds');
            expect(weightMetric!.confidence).toBe(ConfidenceLevel.HIGH);

            const distanceMetric = metrics.find(m => m.targetValue === 5);
            expect(distanceMetric).toBeDefined();
            expect(distanceMetric!.unit).toBe('miles');
        });

        it('should suggest implicit metrics for weight loss goals', async () => {
            const description = 'I want to lose weight and get healthier';
            const metrics = await processor.identifyMetrics(description);

            expect(metrics.length).toBeGreaterThan(0);
            const weightMetric = metrics.find(m => m.name === 'weight_loss');
            expect(weightMetric).toBeDefined();
            expect(weightMetric!.unit).toBe('pounds');
            expect(weightMetric!.confidence).toBe(ConfidenceLevel.MEDIUM);
        });

        it('should suggest savings metrics for financial goals', async () => {
            const description = 'I want to save money for vacation';
            const metrics = await processor.identifyMetrics(description);

            const savingsMetric = metrics.find(m => m.name === 'savings');
            expect(savingsMetric).toBeDefined();
            expect(savingsMetric!.unit).toBe('dollars');
            expect(savingsMetric!.targetValue).toBe(1000);
        });

        it('should suggest reading metrics for book-related goals', async () => {
            const description = 'I want to read more books this year';
            const metrics = await processor.identifyMetrics(description);

            const readingMetric = metrics.find(m => m.name === 'books_read');
            expect(readingMetric).toBeDefined();
            expect(readingMetric!.unit).toBe('books');
            expect(readingMetric!.targetValue).toBe(12);
        });

        it('should provide default completion metric when no specific metrics found', async () => {
            const description = 'I want to improve my general well-being';
            const metrics = await processor.identifyMetrics(description);

            expect(metrics).toHaveLength(1);
            expect(metrics[0].name).toBe('completion');
            expect(metrics[0].unit).toBe('percent');
            expect(metrics[0].targetValue).toBe(100);
            expect(metrics[0].confidence).toBe(ConfidenceLevel.LOW);
        });

        it('should handle percentage metrics', async () => {
            const description = 'I want to improve my test scores by 20%';
            const metrics = await processor.identifyMetrics(description);

            const percentMetric = metrics.find(m => m.targetValue === 20);
            expect(percentMetric).toBeDefined();
            expect(percentMetric!.unit).toBe('%');
        });

        it('should extract multiple explicit metrics from complex descriptions', async () => {
            const description = 'I want to save $2000, lose 10 pounds, and read 6 books';
            const metrics = await processor.identifyMetrics(description);

            expect(metrics.length).toBeGreaterThanOrEqual(3);

            const values = metrics.map(m => m.targetValue);
            expect(values).toContain(2000);
            expect(values).toContain(10);
            expect(values).toContain(6);
        });
    });

    describe('extractConstraints', () => {
        it('should extract time constraints from descriptions', async () => {
            const description = 'I have a strict deadline and can only work weekends';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.timeConstraints).toContain('strict deadline');
            expect(constraints.timeConstraints).toContain('limited time availability');
        });

        it('should extract budget constraints', async () => {
            const description = 'I want to learn programming but I am on a tight budget';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.resourceConstraints).toContain('budget limitations');
        });

        it('should extract location constraints', async () => {
            const description = 'I want to exercise but I cannot go to a gym, only at home';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.resourceConstraints).toContain('location constraints');
        });

        it('should extract personal constraints like beginner level', async () => {
            const description = 'I am a complete beginner and have never done this before';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.personalConstraints).toContain('beginner level');
        });

        it('should extract preferences for timing', async () => {
            const description = 'I prefer to work on this in the morning and like gradual progress';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.preferences).toContain('morning schedule');
            expect(constraints.preferences).toContain('gradual progress');
        });

        it('should handle descriptions without explicit constraints', async () => {
            const description = 'I want to learn something new';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.timeConstraints).toEqual([]);
            expect(constraints.resourceConstraints).toEqual([]);
            expect(constraints.personalConstraints).toEqual([]);
            expect(constraints.preferences).toEqual([]);
        });

        it('should extract equipment limitations', async () => {
            const description = 'I want to get fit but I have no equipment available';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.resourceConstraints).toContain('equipment limitations');
        });

        it('should extract health limitations', async () => {
            const description = 'I want to exercise but I have a knee injury';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.personalConstraints).toContain('health limitations');
        });

        it('should extract aggressive timeline preferences', async () => {
            const description = 'I want to achieve this goal quickly and aggressively';
            const constraints = await processor.extractConstraints(description);

            expect(constraints.preferences).toContain('aggressive timeline');
        });
    });

    describe('integration tests', () => {
        it('should handle complex multi-domain goal descriptions', async () => {
            const description = 'I want to lose 20 pounds in 6 months by working out 3 times a week and eating healthier because I have a wedding coming up';

            const intent = await processor.extractIntent(description);
            const timeframe = await processor.parseTimeframes(description);
            const metrics = await processor.identifyMetrics(description);
            const constraints = await processor.extractConstraints(description);

            // Check intent extraction
            expect(intent.domain).toBe(LifeDomain.FITNESS);
            expect(intent.action).toBe('lose');
            expect(intent.context.some(c => c.toLowerCase().includes('wedding coming up'))).toBe(true);

            // Check timeframe parsing
            expect(timeframe.endDate).toBeInstanceOf(Date);
            expect(timeframe.extractedPhrases).toContain('in 6 months');

            // Check metrics identification
            const weightMetric = metrics.find(m => m.targetValue === 20);
            expect(weightMetric).toBeDefined();
            expect(weightMetric!.unit).toBe('pounds');

            const workoutMetric = metrics.find(m => m.targetValue === 3);
            expect(workoutMetric).toBeDefined();
        });

        it('should handle learning goals with specific timeframes and constraints', async () => {
            const description = 'I am a beginner who wants to learn JavaScript in 3 months, spending 2 hours daily, but I have a limited budget for courses';

            const intent = await processor.extractIntent(description);
            const timeframe = await processor.parseTimeframes(description);
            const metrics = await processor.identifyMetrics(description);
            const constraints = await processor.extractConstraints(description);

            expect(intent.domain).toBe(LifeDomain.LEARNING);
            expect(intent.action).toBe('learn');
            expect(intent.outcome.toLowerCase()).toContain('javascript');

            expect(timeframe.duration).toEqual({
                hours: 2,
                days: undefined,
                weeks: undefined
            });

            expect(constraints.personalConstraints).toContain('beginner level');
            expect(constraints.resourceConstraints).toContain('budget limitations');
        });

        it('should handle financial goals with specific amounts and timeframes', async () => {
            const description = 'I need to save $10000 for a house down payment by next year, but I can only save $500 per month';

            const intent = await processor.extractIntent(description);
            const timeframe = await processor.parseTimeframes(description);
            const metrics = await processor.identifyMetrics(description);

            expect(intent.domain).toBe(LifeDomain.FINANCE);
            expect(intent.action).toBe('save');

            expect(timeframe.endDate).toBeInstanceOf(Date);

            const savingsMetric = metrics.find(m => m.targetValue === 10000);
            expect(savingsMetric).toBeDefined();
            expect(savingsMetric!.unit).toBe('$');

            const monthlyMetric = metrics.find(m => m.targetValue === 500);
            expect(monthlyMetric).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle null or undefined descriptions gracefully', async () => {
            await expect(processor.extractIntent(null as any)).rejects.toMatchObject({
                type: AIGoalPlanningError.INSUFFICIENT_DESCRIPTION
            });
        });

        it('should handle very long descriptions without crashing', async () => {
            const longDescription = 'I want to learn '.repeat(100) + 'programming';

            const intent = await processor.extractIntent(longDescription);
            expect(intent).toBeDefined();
            expect(intent.domain).toBe(LifeDomain.LEARNING);
        });

        it('should handle descriptions with special characters', async () => {
            const description = 'I want to save $1,000.50 for my vacation! @#$%^&*()';

            const intent = await processor.extractIntent(description);
            const metrics = await processor.identifyMetrics(description);

            expect(intent).toBeDefined();
            expect(metrics.length).toBeGreaterThan(0);
        });

        it('should handle non-English characters gracefully', async () => {
            const description = 'I want to learn español and français';

            const intent = await processor.extractIntent(description);
            expect(intent).toBeDefined();
            expect(intent.domain).toBe(LifeDomain.LEARNING);
        });
    });
});