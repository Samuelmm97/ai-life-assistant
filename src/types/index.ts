// Core enums and types
export enum GoalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum LifeDomain {
  FITNESS = 'fitness',
  NUTRITION = 'nutrition',
  FINANCE = 'finance',
  LEARNING = 'learning',
  HEALTH = 'health',
  SLEEP = 'sleep',
  HABITS = 'habits',
  CAREER = 'career',
  SOCIAL = 'social',
  PROJECTS = 'projects'
}

// Time-related types
export interface TimeConstraint {
  startDate: Date;
  endDate: Date;
  milestones: Date[];
}

export interface Duration {
  hours: number;
  days?: number;
  weeks?: number;
}

// Measurement types
export interface MeasurableMetric {
  name: string;
  unit: string;
  targetValue: number;
  currentValue: number;
}

export interface AchievabilityAssessment {
  difficultyLevel: 'easy' | 'moderate' | 'challenging' | 'difficult';
  requiredResources: string[];
  estimatedEffort: Duration;
}

export interface RelevanceContext {
  personalValues: string[];
  lifeAreas: LifeDomain[];
  motivation: string;
}

// SMART Goal interface
export interface SMARTGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  specific: string;
  measurable: MeasurableMetric[];
  achievable: AchievabilityAssessment;
  relevant: RelevanceContext;
  timeBound: TimeConstraint;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}