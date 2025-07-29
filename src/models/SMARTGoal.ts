import { v4 as uuidv4 } from 'uuid';
import { 
  SMARTGoal,
  GoalStatus, 
  TimeConstraint, 
  MeasurableMetric, 
  AchievabilityAssessment, 
  RelevanceContext 
} from '../types';

export class SMARTGoalModel {
  public id: string;
  public userId: string;
  public title: string;
  public description: string;
  public specific: string;
  public measurable: MeasurableMetric[];
  public achievable: AchievabilityAssessment;
  public relevant: RelevanceContext;
  public timeBound: TimeConstraint;
  public status: GoalStatus;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Omit<SMARTGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    this.id = uuidv4();
    this.userId = data.userId;
    this.title = data.title;
    this.description = data.description;
    this.specific = data.specific;
    this.measurable = data.measurable;
    this.achievable = data.achievable;
    this.relevant = data.relevant;
    this.timeBound = data.timeBound;
    this.status = data.status || GoalStatus.DRAFT;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public update(updates: Partial<Omit<SMARTGoal, 'id' | 'createdAt'>>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.status = GoalStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public complete(): void {
    this.status = GoalStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  public pause(): void {
    this.status = GoalStatus.PAUSED;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    this.status = GoalStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  public toJSON(): SMARTGoal {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      specific: this.specific,
      measurable: this.measurable,
      achievable: this.achievable,
      relevant: this.relevant,
      timeBound: this.timeBound,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}