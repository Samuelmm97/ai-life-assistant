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

export enum FlexibilityLevel {
  FIXED = 'fixed',
  FLEXIBLE = 'flexible',
  VERY_FLEXIBLE = 'very_flexible'
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
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

// Calendar and Schedule types
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
}

export interface ScheduleEntry {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  domain?: LifeDomain;
  goalId?: string;
  priority: Priority;
  flexibility: FlexibilityLevel;
  dependencies: string[];
  recurrence?: RecurrencePattern;
  isImported: boolean;
  source?: string; // 'google', 'manual', etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarConflict {
  id: string;
  conflictingEntries: ScheduleEntry[];
  type: 'overlap' | 'dependency' | 'resource';
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface TimeBlock {
  id: string;
  goalId: string;
  title: string;
  duration: Duration;
  preferredTimes: string[]; // e.g., ['morning', 'afternoon', 'evening']
  frequency: RecurrencePattern;
  flexibility: FlexibilityLevel;
}