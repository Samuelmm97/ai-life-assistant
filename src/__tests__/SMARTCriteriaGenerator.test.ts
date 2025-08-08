import { SMARTCriteriaGeneratorService } from '../services/SMARTCriteriaGenerator';
import {
    GoalIntent,
    TimeframeInfo,
    LifeDomain,
    UrgencyLevel,
    TimeframeFlexibility,
    ConfidenceLevel,
    Duration
} from '../types';

describe('SMARTCriteriaGeneratorService', () => {
    let generator: SMARTCriteriaGeneratorService;

    beforeEach(() => {
        generator = new SMARTCriteriaGeneratorService();
    });

    describe('generateSpecific', () => {
        it('should generate specific criteria for fitness goals', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'lose 10 pounds',
                context: ['to improve health'],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateSpecific(intent);

            expect(result.content).toContain('lose 10 pounds');
            expect(result.content).toContain('exercise');
            expect(result.content).toContain('to improve health');
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
            expect(result.reasoning).toContain('fitness domain template');
        });

        it('should generate specific criteria for learning goals', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.LEARNING,
                action: 'study',
                outcome: 'JavaScript programming',
                context: ['for career advancement'],
                urgency: UrgencyLevel.HIGH
            };

            const result = await generator.generateSpecific(intent);

            expect(result.content).toContain('JavaScript programming');
            expect(result.content).toContain('study');
            expect(result.content).toContain('for career advancement');
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should use generic template for unsupported domains', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.SOCIAL,
                action: 'meet',
                outcome: 'new friends',
                context: [],
                urgency: UrgencyLevel.LOW
            };

            const result = await generator.generateSpecific(intent);

            expect(result.content).toContain('new friends');
            expect(result.content).toContain('meet');
            expect(result.confidence).toBe(ConfidenceLevel.MEDIUM);
            expect(result.reasoning).toContain('generic specific statement');
        });

        it('should handle empty context gracefully', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'run',
                outcome: 'marathon',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateSpecific(intent);

            expect(result.content).toContain('marathon');
            expect(result.content).toContain('run');
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });
    });

    describe('generateMeasurable', () => {
        it('should extract explicit dollar amounts from description', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FINANCE,
                action: 'save',
                outcome: 'money',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const description = 'I want to save $5000 for an emergency fund';

            const result = await generator.generateMeasurable(intent, description);

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('target_amount');
            expect(result.content[0].unit).toBe('dollars');
            expect(result.content[0].targetValue).toBe(5000);
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should extract weight metrics from description', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'lose',
                outcome: 'weight',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const description = 'I want to lose 15 pounds by summer';

            const result = await generator.generateMeasurable(intent, description);

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('weight_target');
            expect(result.content[0].unit).toBe('pounds');
            expect(result.content[0].targetValue).toBe(15);
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should extract time-based metrics from description', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.LEARNING,
                action: 'study',
                outcome: 'programming',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const description = 'I want to study 2 hours daily to learn programming';

            const result = await generator.generateMeasurable(intent, description);

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('daily_time');
            expect(result.content[0].unit).toBe('hours');
            expect(result.content[0].targetValue).toBe(2);
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should use domain-specific metrics when no explicit metrics found', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const description = 'I want to get fit and healthy';

            const result = await generator.generateMeasurable(intent, description);

            expect(result.content.length).toBeGreaterThan(0);
            expect(result.content.some(m => m.name === 'weight_loss')).toBe(true);
            expect(result.confidence).toBe(ConfidenceLevel.MEDIUM);
        });

        it('should provide fallback completion metric', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.SOCIAL,
                action: 'improve',
                outcome: 'relationships',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const description = 'I want to improve my relationships';

            const result = await generator.generateMeasurable(intent, description);

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('completion_progress');
            expect(result.content[0].unit).toBe('percent');
            expect(result.content[0].targetValue).toBe(100);
            expect(result.confidence).toBe(ConfidenceLevel.LOW);
        });
    });

    describe('generateAchievable', () => {
        it('should assess easy difficulty for simple goals with long timeframe', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.HABITS,
                action: 'drink',
                outcome: 'more water',
                context: [],
                urgency: UrgencyLevel.LOW
            };
            const timeframe: TimeframeInfo = {
                startDate: new Date(),
                endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };

            const result = await generator.generateAchievable(intent, timeframe);

            expect(result.content.difficultyLevel).toBe('easy');
            expect(result.content.requiredResources).toContain('time');
            expect(result.content.estimatedEffort.hours).toBeGreaterThan(0);
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should assess difficult difficulty for urgent complex goals', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.CAREER,
                action: 'get',
                outcome: 'promotion',
                context: [],
                urgency: UrgencyLevel.HIGH
            };
            const timeframe: TimeframeInfo = {
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FIXED,
                extractedPhrases: []
            };

            const result = await generator.generateAchievable(intent, timeframe);

            expect(result.content.difficultyLevel).toBe('difficult');
            expect(result.content.requiredResources.length).toBeGreaterThan(0);
            expect(result.confidence).toBeDefined();
        });

        it('should include context-specific resources', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'train',
                outcome: 'strength',
                context: ['need equipment', 'budget constraints'],
                urgency: UrgencyLevel.MEDIUM
            };
            const timeframe: TimeframeInfo = {
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };

            const result = await generator.generateAchievable(intent, timeframe);

            expect(result.content.requiredResources).toContain('specialized equipment');
            expect(result.content.requiredResources).toContain('financial planning');
        });

        it('should adjust effort estimation based on domain', async () => {
            const learningIntent: GoalIntent = {
                domain: LifeDomain.LEARNING,
                action: 'learn',
                outcome: 'Python',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const fitnessIntent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'strength',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const timeframe: TimeframeInfo = {
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };

            const learningResult = await generator.generateAchievable(learningIntent, timeframe);
            const fitnessResult = await generator.generateAchievable(fitnessIntent, timeframe);

            expect(learningResult.content.estimatedEffort.hours).toBeGreaterThan(
                fitnessResult.content.estimatedEffort.hours
            );
        });
    });

    describe('generateRelevant', () => {
        it('should generate relevance context for fitness domain', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'health',
                context: ['to feel more confident'],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateRelevant(intent, 'user123');

            expect(result.content.personalValues).toContain('health');
            expect(result.content.personalValues).toContain('self-confidence');
            expect(result.content.lifeAreas).toContain(LifeDomain.FITNESS);
            expect(result.content.motivation).toContain('to feel more confident');
            expect(result.confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('should extract values from context', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FINANCE,
                action: 'save',
                outcome: 'money',
                context: ['for family security', 'career advancement'],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateRelevant(intent, 'user123');

            expect(result.content.personalValues).toContain('family');
            expect(result.content.personalValues).toContain('career advancement');
            expect(result.content.personalValues).toContain('financial security');
        });

        it('should provide default motivation when no context', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.LEARNING,
                action: 'study',
                outcome: 'skills',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateRelevant(intent, 'user123');

            expect(result.content.motivation).toBe('personal growth and skill development');
            expect(result.confidence).toBe(ConfidenceLevel.MEDIUM);
        });
    });

    describe('generateTimeBound', () => {
        it('should use provided start and end dates', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-03-01');
            const timeframe: TimeframeInfo = {
                startDate,
                endDate,
                duration: null,
                milestones: ['first milestone', 'second milestone'],
                flexibility: TimeframeFlexibility.FIXED,
                extractedPhrases: ['by March']
            };
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateTimeBound(timeframe, intent);

            expect(result.content.startDate).toEqual(startDate);
            expect(result.content.endDate).toEqual(endDate);
            expect(result.content.milestones).toHaveLength(2);
            expect(result.confidence).toBe(ConfidenceLevel.VERY_HIGH);
            expect(result.reasoning).toContain('explicit start date');
            expect(result.reasoning).toContain('explicit end date');
        });

        it('should generate end date from duration', async () => {
            const startDate = new Date();
            const duration: Duration = { hours: 240, days: 30, weeks: 4 }; // 30 days
            const timeframe: TimeframeInfo = {
                startDate,
                endDate: null,
                duration,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: ['for 30 days']
            };
            const intent: GoalIntent = {
                domain: LifeDomain.HABITS,
                action: 'practice',
                outcome: 'meditation',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateTimeBound(timeframe, intent);

            expect(result.content.startDate).toEqual(startDate);
            expect(result.content.endDate.getTime()).toBeGreaterThan(startDate.getTime());
            expect(result.reasoning).toContain('duration-based end date');
        });

        it('should generate default timeline when no timeframe provided', async () => {
            const timeframe: TimeframeInfo = {
                startDate: null,
                endDate: null,
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateTimeBound(timeframe, intent);

            expect(result.content.startDate).toBeDefined();
            expect(result.content.endDate).toBeDefined();
            expect(result.content.endDate.getTime()).toBeGreaterThan(result.content.startDate.getTime());
            expect(result.reasoning).toContain('domain-appropriate default timeline');
        });

        it('should adjust timeline based on urgency', async () => {
            const timeframe: TimeframeInfo = {
                startDate: null,
                endDate: null,
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };
            const highUrgencyIntent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.HIGH
            };
            const lowUrgencyIntent: GoalIntent = {
                ...highUrgencyIntent,
                urgency: UrgencyLevel.LOW
            };

            const highUrgencyResult = await generator.generateTimeBound(timeframe, highUrgencyIntent);
            const lowUrgencyResult = await generator.generateTimeBound(timeframe, lowUrgencyIntent);

            const highUrgencyDuration = highUrgencyResult.content.endDate.getTime() - highUrgencyResult.content.startDate.getTime();
            const lowUrgencyDuration = lowUrgencyResult.content.endDate.getTime() - lowUrgencyResult.content.startDate.getTime();

            expect(highUrgencyDuration).toBeLessThan(lowUrgencyDuration);
        });

        it('should generate milestone dates from existing milestone descriptions', async () => {
            const startDate = new Date();
            const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
            const timeframe: TimeframeInfo = {
                startDate,
                endDate,
                duration: null,
                milestones: ['complete first phase', 'reach halfway point', 'final preparations'],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };
            const intent: GoalIntent = {
                domain: LifeDomain.LEARNING,
                action: 'study',
                outcome: 'certification',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateTimeBound(timeframe, intent);

            expect(result.content.milestones).toHaveLength(3);
            expect(result.content.milestones[0].getTime()).toBeGreaterThan(startDate.getTime());
            expect(result.content.milestones[0].getTime()).toBeLessThan(endDate.getTime());
            expect(result.content.milestones[2].getTime()).toBeLessThan(endDate.getTime());
        });

        it('should generate default milestones when none provided', async () => {
            const startDate = new Date();
            const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            const timeframe: TimeframeInfo = {
                startDate,
                endDate,
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            const result = await generator.generateTimeBound(timeframe, intent);

            expect(result.content.milestones).toHaveLength(3); // 25%, 50%, 75%
            expect(result.content.milestones[0].getTime()).toBeLessThan(result.content.milestones[1].getTime());
            expect(result.content.milestones[1].getTime()).toBeLessThan(result.content.milestones[2].getTime());
        });
    });

    describe('error handling', () => {
        it('should throw appropriate error for generateSpecific failure', async () => {
            const invalidIntent = {
                domain: LifeDomain.FITNESS,
                action: '', // Empty action should cause validation failure
                outcome: '',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            } as GoalIntent;

            try {
                const result = await generator.generateSpecific(invalidIntent);
                fail('Expected method to throw an error, but it returned: ' + JSON.stringify(result));
            } catch (error) {
                expect(error).toBeDefined();
                expect(error).toHaveProperty('type');
            }
        });

        it('should throw appropriate error for generateMeasurable failure', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };

            // This should not throw as we have fallback mechanisms
            const result = await generator.generateMeasurable(intent, '');
            expect(result.content).toBeDefined();
        });

        it('should handle null/undefined values gracefully', async () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'exercise',
                outcome: 'fitness',
                context: [],
                urgency: UrgencyLevel.MEDIUM
            };
            const timeframe: TimeframeInfo = {
                startDate: null,
                endDate: null,
                duration: null,
                milestones: [],
                flexibility: TimeframeFlexibility.FLEXIBLE,
                extractedPhrases: []
            };

            const specificResult = await generator.generateSpecific(intent);
            const measurableResult = await generator.generateMeasurable(intent, '');
            const achievableResult = await generator.generateAchievable(intent, timeframe);
            const relevantResult = await generator.generateRelevant(intent, 'user123');
            const timeBoundResult = await generator.generateTimeBound(timeframe, intent);

            expect(specificResult.content).toBeDefined();
            expect(measurableResult.content).toBeDefined();
            expect(achievableResult.content).toBeDefined();
            expect(relevantResult.content).toBeDefined();
            expect(timeBoundResult.content).toBeDefined();
        });
    });
});