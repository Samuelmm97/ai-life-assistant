import {
    ConfidenceLevel,
    AIGoalPlanningError,
    AIGoalPlanningException,
    GeneratedSMARTComponent,
    AIGoalPlan,
    UrgencyLevel,
    TimeframeFlexibility
} from './ai-goal-planning';

// Utility functions for working with AI Goal Planning types

export class AIGoalPlanningUtils {
    /**
     * Convert confidence level to numeric score for calculations
     */
    static confidenceToScore(level: ConfidenceLevel): number {
        switch (level) {
            case ConfidenceLevel.VERY_LOW: return 0.1;
            case ConfidenceLevel.LOW: return 0.3;
            case ConfidenceLevel.MEDIUM: return 0.5;
            case ConfidenceLevel.HIGH: return 0.7;
            case ConfidenceLevel.VERY_HIGH: return 0.9;
            default: return 0.5;
        }
    }

    /**
     * Convert numeric score to confidence level
     */
    static scoreToConfidence(score: number): ConfidenceLevel {
        if (score >= 0.8) return ConfidenceLevel.VERY_HIGH;
        if (score >= 0.6) return ConfidenceLevel.HIGH;
        if (score >= 0.4) return ConfidenceLevel.MEDIUM;
        if (score >= 0.2) return ConfidenceLevel.LOW;
        return ConfidenceLevel.VERY_LOW;
    }

    /**
     * Calculate overall confidence for an AI goal plan
     */
    static calculateOverallConfidence(plan: AIGoalPlan): ConfidenceLevel {
        const scores = [
            this.confidenceToScore(plan.generatedSMART.specific.confidence),
            this.confidenceToScore(plan.generatedSMART.measurable.confidence),
            this.confidenceToScore(plan.generatedSMART.achievable.confidence),
            this.confidenceToScore(plan.generatedSMART.relevant.confidence),
            this.confidenceToScore(plan.generatedSMART.timeBound.confidence)
        ];

        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return this.scoreToConfidence(averageScore);
    }

    /**
     * Create a standardized AI goal planning exception
     */
    static createException(
        type: AIGoalPlanningError,
        message: string,
        suggestions: string[] = [],
        recoverable: boolean = true,
        originalError?: Error
    ): AIGoalPlanningException {
        return {
            type,
            message,
            suggestions,
            recoverable,
            originalError
        };
    }

    /**
     * Check if an error is recoverable
     */
    static isRecoverableError(error: AIGoalPlanningException): boolean {
        return error.recoverable && error.type !== AIGoalPlanningError.SERVICE_UNAVAILABLE;
    }

    /**
     * Get user-friendly error message with suggestions
     */
    static getErrorMessage(error: AIGoalPlanningException): string {
        let message = error.message;
        if (error.suggestions.length > 0) {
            message += '\n\nSuggestions:\n' + error.suggestions.map(s => `• ${s}`).join('\n');
        }
        return message;
    }

    /**
     * Validate that a generated SMART component has minimum required confidence
     */
    static hasMinimumConfidence(component: GeneratedSMARTComponent<any>, minLevel: ConfidenceLevel = ConfidenceLevel.LOW): boolean {
        return this.confidenceToScore(component.confidence) >= this.confidenceToScore(minLevel);
    }

    /**
     * Get urgency level from text indicators
     */
    static inferUrgencyFromText(text: string): UrgencyLevel {
        const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
        const highKeywords = ['soon', 'quickly', 'fast', 'priority', 'important'];

        const lowerText = text.toLowerCase();

        if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
            return UrgencyLevel.HIGH;
        }

        if (highKeywords.some(keyword => lowerText.includes(keyword))) {
            return UrgencyLevel.MEDIUM;
        }

        return UrgencyLevel.LOW;
    }

    /**
     * Get timeframe flexibility from text indicators
     */
    static inferFlexibilityFromText(text: string): TimeframeFlexibility {
        const fixedKeywords = ['exactly', 'must', 'deadline', 'fixed', 'strict'];
        const flexibleKeywords = ['around', 'approximately', 'roughly', 'flexible', 'about'];
        const veryFlexibleKeywords = ['whenever', 'eventually', 'someday', 'no rush'];

        const lowerText = text.toLowerCase();

        if (fixedKeywords.some(keyword => lowerText.includes(keyword))) {
            return TimeframeFlexibility.FIXED;
        }

        if (veryFlexibleKeywords.some(keyword => lowerText.includes(keyword))) {
            return TimeframeFlexibility.VERY_FLEXIBLE;
        }

        if (flexibleKeywords.some(keyword => lowerText.includes(keyword))) {
            return TimeframeFlexibility.FLEXIBLE;
        }

        return TimeframeFlexibility.FLEXIBLE; // Default to flexible
    }
}

// Type guards for AI Goal Planning types

export class AIGoalPlanningTypeGuards {
    static isValidConfidenceLevel(value: any): value is ConfidenceLevel {
        return Object.values(ConfidenceLevel).includes(value);
    }

    static isValidUrgencyLevel(value: any): value is UrgencyLevel {
        return Object.values(UrgencyLevel).includes(value);
    }

    static isValidTimeframeFlexibility(value: any): value is TimeframeFlexibility {
        return Object.values(TimeframeFlexibility).includes(value);
    }

    static isValidAIGoalPlanningError(value: any): value is AIGoalPlanningError {
        return Object.values(AIGoalPlanningError).includes(value);
    }

    static isGeneratedSMARTComponent<T>(value: any): value is GeneratedSMARTComponent<T> {
        return (
            value &&
            typeof value === 'object' &&
            'content' in value &&
            'confidence' in value &&
            'reasoning' in value &&
            this.isValidConfidenceLevel(value.confidence) &&
            typeof value.reasoning === 'string'
        );
    }
}

// Constants for AI Goal Planning

export const AI_GOAL_PLANNING_CONSTANTS = {
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_CONFIDENCE_THRESHOLD: ConfidenceLevel.LOW,
    DEFAULT_PROCESSING_TIMEOUT: 30000, // 30 seconds
    MAX_REFINEMENT_ITERATIONS: 5,
    MAX_CONVERSATION_TURNS: 20
} as const;