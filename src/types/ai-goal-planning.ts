import {
    LifeDomain,
    MeasurableMetric,
    AchievabilityAssessment,
    RelevanceContext,
    TimeConstraint,
    Duration,
    SMARTGoal
} from './index';

// AI Planning States
export enum AIGoalPlanningState {
    INITIALIZING = 'initializing',
    PROCESSING_DESCRIPTION = 'processing_description',
    GENERATING_SMART = 'generating_smart',
    AWAITING_FEEDBACK = 'awaiting_feedback',
    REFINING_PLAN = 'refining_plan',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

// Confidence Levels
export enum ConfidenceLevel {
    VERY_LOW = 'very_low',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    VERY_HIGH = 'very_high'
}

// Urgency Levels
export enum UrgencyLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

// Flexibility Levels for Timeframes
export enum TimeframeFlexibility {
    FIXED = 'fixed',
    FLEXIBLE = 'flexible',
    VERY_FLEXIBLE = 'very_flexible'
}

// Conversation Status
export enum ConversationStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned'
}

// Conversation Turn Types
export enum ConversationTurnType {
    USER_INPUT = 'user_input',
    AI_RESPONSE = 'ai_response',
    PLAN_UPDATE = 'plan_update'
}

// Error Types for AI Goal Planning
export enum AIGoalPlanningError {
    INSUFFICIENT_DESCRIPTION = 'insufficient_description',
    AMBIGUOUS_INTENT = 'ambiguous_intent',
    UNREALISTIC_TIMEFRAME = 'unrealistic_timeframe',
    UNMEASURABLE_GOAL = 'unmeasurable_goal',
    PROCESSING_TIMEOUT = 'processing_timeout',
    VALIDATION_FAILED = 'validation_failed',
    SERVICE_UNAVAILABLE = 'service_unavailable',
    INVALID_FEEDBACK = 'invalid_feedback'
}

// Core AI Goal Planning Interfaces

export interface GoalIntent {
    domain: LifeDomain;
    action: string;
    outcome: string;
    context: string[];
    urgency: UrgencyLevel;
}

export interface TimeframeInfo {
    startDate: Date | null;
    endDate: Date | null;
    duration: Duration | null;
    milestones: string[];
    flexibility: TimeframeFlexibility;
    extractedPhrases: string[];
}

export interface MetricSuggestion {
    name: string;
    unit: string;
    targetValue: number;
    confidence: ConfidenceLevel;
    reasoning: string;
}

export interface ConstraintInfo {
    timeConstraints: string[];
    resourceConstraints: string[];
    personalConstraints: string[];
    preferences: string[];
}

export interface GeneratedSMARTComponent<T> {
    content: T;
    confidence: ConfidenceLevel;
    reasoning: string;
}

export interface GeneratedSMARTCriteria {
    specific: GeneratedSMARTComponent<string>;
    measurable: GeneratedSMARTComponent<MeasurableMetric[]>;
    achievable: GeneratedSMARTComponent<AchievabilityAssessment>;
    relevant: GeneratedSMARTComponent<RelevanceContext>;
    timeBound: GeneratedSMARTComponent<TimeConstraint>;
}

export interface AIGoalPlan {
    id: string;
    userId: string;
    title: string;
    description: string;
    originalDescription: string;
    extractedIntent: GoalIntent;
    generatedSMART: GeneratedSMARTCriteria;
    smartCriteria?: {
        specific: string;
        measurable: string;
        achievable: string;
        relevant: string;
        timeBound: string;
    };
    domain?: LifeDomain;
    priority?: 'low' | 'medium' | 'high';
    milestones?: Array<{
        id?: string;
        title: string;
        description?: string;
        targetDate: string;
        completed?: boolean;
    }>;
    confidence: ConfidenceLevel;
    suggestions: string[];
    state: AIGoalPlanningState;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationTurn {
    id: string;
    type: ConversationTurnType;
    content: string;
    timestamp: Date;
    planSnapshot?: AIGoalPlan;
}

export interface ConversationSession {
    id: string;
    userId: string;
    currentPlan: AIGoalPlan;
    conversationHistory: ConversationTurn[];
    status: ConversationStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationResponse {
    updatedPlan: AIGoalPlan;
    response: string;
    suggestions: string[];
    requiresUserInput: boolean;
}

// Exception and Error Interfaces

export interface AIGoalPlanningException {
    type: AIGoalPlanningError;
    message: string;
    suggestions: string[];
    recoverable: boolean;
    originalError?: Error;
}

export interface ValidationResult {
    isValid: boolean;
    errors: AIGoalPlanningException[];
    warnings: string[];
    confidence: ConfidenceLevel;
}

// Service Interfaces

export interface NaturalLanguageProcessor {
    extractIntent(description: string): Promise<GoalIntent>;
    parseTimeframes(description: string): Promise<TimeframeInfo>;
    identifyMetrics(description: string): Promise<MetricSuggestion[]>;
    extractConstraints(description: string): Promise<ConstraintInfo>;
}

export interface SMARTCriteriaGenerator {
    generateSpecific(intent: GoalIntent): Promise<GeneratedSMARTComponent<string>>;
    generateMeasurable(intent: GoalIntent, description: string): Promise<GeneratedSMARTComponent<MeasurableMetric[]>>;
    generateAchievable(intent: GoalIntent, timeframe: TimeframeInfo): Promise<GeneratedSMARTComponent<AchievabilityAssessment>>;
    generateRelevant(intent: GoalIntent, userId: string): Promise<GeneratedSMARTComponent<RelevanceContext>>;
    generateTimeBound(timeframe: TimeframeInfo, intent: GoalIntent): Promise<GeneratedSMARTComponent<TimeConstraint>>;
}

export interface AIGoalPlanner {
    generateGoalFromDescription(description: string, userId: string): Promise<AIGoalPlan>;
    refineGoalPlan(planId: string, feedback: string): Promise<AIGoalPlan>;
    convertToSMARTGoal(plan: AIGoalPlan): Promise<SMARTGoal>;
    validatePlan(plan: AIGoalPlan): Promise<ValidationResult>;
}

export interface ConversationManager {
    startGoalConversation(description: string, userId: string): Promise<ConversationSession>;
    processUserFeedback(sessionId: string, feedback: string): Promise<ConversationResponse>;
    finalizeGoal(sessionId: string): Promise<SMARTGoal>;
    getConversationHistory(sessionId: string): Promise<ConversationTurn[]>;
    abandonConversation(sessionId: string): Promise<void>;
}

export interface AIGoalValidator {
    validateGeneratedPlan(plan: AIGoalPlan): Promise<ValidationResult>;
    scoreConfidence(component: GeneratedSMARTComponent<any>): ConfidenceLevel;
    checkRealism(plan: AIGoalPlan): Promise<boolean>;
    compareWithSMARTValidation(plan: AIGoalPlan): Promise<ValidationResult>;
}