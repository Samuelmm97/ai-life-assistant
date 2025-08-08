import {
    AIGoalPlanningState,
    ConfidenceLevel,
    UrgencyLevel,
    TimeframeFlexibility,
    AIGoalPlanningError,
    GoalIntent,
    GeneratedSMARTCriteria,
    AIGoalPlan,
    AIGoalPlanningUtils,
    AIGoalPlanningTypeGuards,
    AI_GOAL_PLANNING_CONSTANTS,
    LifeDomain
} from '../types';

describe('AI Goal Planning Types', () => {
    describe('Enums', () => {
        test('AIGoalPlanningState enum has correct values', () => {
            expect(AIGoalPlanningState.INITIALIZING).toBe('initializing');
            expect(AIGoalPlanningState.PROCESSING_DESCRIPTION).toBe('processing_description');
            expect(AIGoalPlanningState.GENERATING_SMART).toBe('generating_smart');
            expect(AIGoalPlanningState.COMPLETED).toBe('completed');
        });

        test('ConfidenceLevel enum has correct values', () => {
            expect(ConfidenceLevel.VERY_LOW).toBe('very_low');
            expect(ConfidenceLevel.LOW).toBe('low');
            expect(ConfidenceLevel.MEDIUM).toBe('medium');
            expect(ConfidenceLevel.HIGH).toBe('high');
            expect(ConfidenceLevel.VERY_HIGH).toBe('very_high');
        });

        test('UrgencyLevel enum has correct values', () => {
            expect(UrgencyLevel.LOW).toBe('low');
            expect(UrgencyLevel.MEDIUM).toBe('medium');
            expect(UrgencyLevel.HIGH).toBe('high');
        });
    });

    describe('Type Creation', () => {
        test('can create GoalIntent object', () => {
            const intent: GoalIntent = {
                domain: LifeDomain.FITNESS,
                action: 'lose weight',
                outcome: 'be healthier',
                context: ['gym', 'diet'],
                urgency: UrgencyLevel.MEDIUM
            };

            expect(intent.domain).toBe(LifeDomain.FITNESS);
            expect(intent.urgency).toBe(UrgencyLevel.MEDIUM);
        });

        test('can create AIGoalPlan object', () => {
            const mockGeneratedSMART: GeneratedSMARTCriteria = {
                specific: {
                    content: 'Lose 10 pounds',
                    confidence: ConfidenceLevel.HIGH,
                    reasoning: 'Clear and specific target'
                },
                measurable: {
                    content: [{
                        name: 'weight',
                        unit: 'pounds',
                        targetValue: 10,
                        currentValue: 0
                    }],
                    confidence: ConfidenceLevel.HIGH,
                    reasoning: 'Quantifiable metric'
                },
                achievable: {
                    content: {
                        difficultyLevel: 'moderate',
                        requiredResources: ['gym membership'],
                        estimatedEffort: { hours: 100 }
                    },
                    confidence: ConfidenceLevel.MEDIUM,
                    reasoning: 'Realistic timeframe'
                },
                relevant: {
                    content: {
                        personalValues: ['health'],
                        lifeAreas: [LifeDomain.FITNESS],
                        motivation: 'improve health'
                    },
                    confidence: ConfidenceLevel.HIGH,
                    reasoning: 'Aligns with health goals'
                },
                timeBound: {
                    content: {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        milestones: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
                    },
                    confidence: ConfidenceLevel.MEDIUM,
                    reasoning: '3 month timeframe is reasonable'
                }
            };

            const plan: AIGoalPlan = {
                id: 'test-id',
                userId: 'user-123',
                originalDescription: 'I want to lose weight',
                extractedIntent: {
                    domain: LifeDomain.FITNESS,
                    action: 'lose weight',
                    outcome: 'be healthier',
                    context: [],
                    urgency: UrgencyLevel.MEDIUM
                },
                generatedSMART: mockGeneratedSMART,
                confidence: ConfidenceLevel.HIGH,
                suggestions: ['Consider tracking daily calories'],
                state: AIGoalPlanningState.COMPLETED,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(plan.id).toBe('test-id');
            expect(plan.state).toBe(AIGoalPlanningState.COMPLETED);
        });
    });

    describe('AIGoalPlanningUtils', () => {
        test('confidenceToScore converts correctly', () => {
            expect(AIGoalPlanningUtils.confidenceToScore(ConfidenceLevel.VERY_LOW)).toBe(0.1);
            expect(AIGoalPlanningUtils.confidenceToScore(ConfidenceLevel.LOW)).toBe(0.3);
            expect(AIGoalPlanningUtils.confidenceToScore(ConfidenceLevel.MEDIUM)).toBe(0.5);
            expect(AIGoalPlanningUtils.confidenceToScore(ConfidenceLevel.HIGH)).toBe(0.7);
            expect(AIGoalPlanningUtils.confidenceToScore(ConfidenceLevel.VERY_HIGH)).toBe(0.9);
        });

        test('scoreToConfidence converts correctly', () => {
            expect(AIGoalPlanningUtils.scoreToConfidence(0.9)).toBe(ConfidenceLevel.VERY_HIGH);
            expect(AIGoalPlanningUtils.scoreToConfidence(0.7)).toBe(ConfidenceLevel.HIGH);
            expect(AIGoalPlanningUtils.scoreToConfidence(0.5)).toBe(ConfidenceLevel.MEDIUM);
            expect(AIGoalPlanningUtils.scoreToConfidence(0.3)).toBe(ConfidenceLevel.LOW);
            expect(AIGoalPlanningUtils.scoreToConfidence(0.1)).toBe(ConfidenceLevel.VERY_LOW);
        });

        test('createException creates proper exception object', () => {
            const exception = AIGoalPlanningUtils.createException(
                AIGoalPlanningError.INSUFFICIENT_DESCRIPTION,
                'Description too short',
                ['Add more details'],
                true
            );

            expect(exception.type).toBe(AIGoalPlanningError.INSUFFICIENT_DESCRIPTION);
            expect(exception.message).toBe('Description too short');
            expect(exception.suggestions).toEqual(['Add more details']);
            expect(exception.recoverable).toBe(true);
        });

        test('inferUrgencyFromText detects urgency correctly', () => {
            expect(AIGoalPlanningUtils.inferUrgencyFromText('I need this urgently')).toBe(UrgencyLevel.HIGH);
            expect(AIGoalPlanningUtils.inferUrgencyFromText('I want this soon')).toBe(UrgencyLevel.MEDIUM);
            expect(AIGoalPlanningUtils.inferUrgencyFromText('I want to learn piano')).toBe(UrgencyLevel.LOW);
        });
    });

    describe('Type Guards', () => {
        test('isValidConfidenceLevel works correctly', () => {
            expect(AIGoalPlanningTypeGuards.isValidConfidenceLevel(ConfidenceLevel.HIGH)).toBe(true);
            expect(AIGoalPlanningTypeGuards.isValidConfidenceLevel('invalid')).toBe(false);
        });

        test('isValidUrgencyLevel works correctly', () => {
            expect(AIGoalPlanningTypeGuards.isValidUrgencyLevel(UrgencyLevel.MEDIUM)).toBe(true);
            expect(AIGoalPlanningTypeGuards.isValidUrgencyLevel('invalid')).toBe(false);
        });
    });

    describe('Constants', () => {
        test('constants have expected values', () => {
            expect(AI_GOAL_PLANNING_CONSTANTS.MIN_DESCRIPTION_LENGTH).toBe(10);
            expect(AI_GOAL_PLANNING_CONSTANTS.MAX_DESCRIPTION_LENGTH).toBe(1000);
            expect(AI_GOAL_PLANNING_CONSTANTS.MIN_CONFIDENCE_THRESHOLD).toBe(ConfidenceLevel.LOW);
        });
    });
});