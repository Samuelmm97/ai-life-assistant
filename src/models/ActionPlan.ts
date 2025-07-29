import { v4 as uuidv4 } from 'uuid';
import { Priority, Duration } from '../types';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedDuration: Duration;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  dependencies: string[]; // Task IDs that must be completed first
}

export interface Dependency {
  id: string;
  dependentTaskId: string;
  prerequisiteTaskId: string;
  type: 'blocking' | 'preferred'; // blocking = must wait, preferred = better if waited
}

export interface Resource {
  id: string;
  name: string;
  type: 'time' | 'money' | 'equipment' | 'skill' | 'other';
  amount: number;
  unit: string;
  available: boolean;
}

export interface ActionPlan {
  id: string;
  goalId: string;
  userId: string;
  milestones: Milestone[];
  tasks: Task[];
  dependencies: Dependency[];
  estimatedDuration: Duration;
  requiredResources: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

export class ActionPlanModel {
  public id: string;
  public goalId: string;
  public userId: string;
  public milestones: Milestone[];
  public tasks: Task[];
  public dependencies: Dependency[];
  public estimatedDuration: Duration;
  public requiredResources: Resource[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'>) {
    this.id = uuidv4();
    this.goalId = data.goalId;
    this.userId = data.userId;
    this.milestones = data.milestones;
    this.tasks = data.tasks;
    this.dependencies = data.dependencies;
    this.estimatedDuration = data.estimatedDuration;
    this.requiredResources = data.requiredResources;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addTask(task: Omit<Task, 'id'>): Task {
    const newTask: Task = {
      id: uuidv4(),
      ...task
    };
    this.tasks.push(newTask);
    this.updatedAt = new Date();
    return newTask;
  }

  public completeTask(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      task.completedAt = new Date();
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  public addMilestone(milestone: Omit<Milestone, 'id'>): Milestone {
    const newMilestone: Milestone = {
      id: uuidv4(),
      ...milestone
    };
    this.milestones.push(newMilestone);
    this.updatedAt = new Date();
    return newMilestone;
  }

  public completeMilestone(milestoneId: string): boolean {
    const milestone = this.milestones.find(m => m.id === milestoneId);
    if (milestone && !milestone.completed) {
      milestone.completed = true;
      milestone.completedAt = new Date();
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  public getProgress(): { completedTasks: number; totalTasks: number; completedMilestones: number; totalMilestones: number } {
    return {
      completedTasks: this.tasks.filter(t => t.completed).length,
      totalTasks: this.tasks.length,
      completedMilestones: this.milestones.filter(m => m.completed).length,
      totalMilestones: this.milestones.length
    };
  }

  public toJSON(): ActionPlan {
    return {
      id: this.id,
      goalId: this.goalId,
      userId: this.userId,
      milestones: this.milestones,
      tasks: this.tasks,
      dependencies: this.dependencies,
      estimatedDuration: this.estimatedDuration,
      requiredResources: this.requiredResources,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}