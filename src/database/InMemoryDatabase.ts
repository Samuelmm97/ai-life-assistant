import { UserModel, User } from '../models/User';
import { SMARTGoalModel } from '../models/SMARTGoal';
import { ActionPlanModel, ActionPlan } from '../models/ActionPlan';
import { SMARTGoal } from '../types';

export class InMemoryDatabase {
  private users: Map<string, UserModel> = new Map();
  private goals: Map<string, SMARTGoalModel> = new Map();
  private actionPlans: Map<string, ActionPlanModel> = new Map();

  // User operations
  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): UserModel {
    const user = new UserModel(userData);
    this.users.set(user.id, user);
    return user;
  }

  public getUserById(id: string): UserModel | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserModel | undefined {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  public updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): UserModel | undefined {
    const user = this.users.get(id);
    if (user) {
      user.update(updates);
      return user;
    }
    return undefined;
  }

  public deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  public getAllUsers(): UserModel[] {
    return Array.from(this.users.values());
  }

  // SMART Goal operations
  public createGoal(goalData: Omit<SMARTGoal, 'id' | 'createdAt' | 'updatedAt'>): SMARTGoalModel {
    const goal = new SMARTGoalModel(goalData);
    this.goals.set(goal.id, goal);
    return goal;
  }

  public getGoalById(id: string): SMARTGoalModel | undefined {
    return this.goals.get(id);
  }

  public getGoalsByUserId(userId: string): SMARTGoalModel[] {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  public updateGoal(id: string, updates: Partial<Omit<SMARTGoal, 'id' | 'createdAt'>>): SMARTGoalModel | undefined {
    const goal = this.goals.get(id);
    if (goal) {
      goal.update(updates);
      return goal;
    }
    return undefined;
  }

  public deleteGoal(id: string): boolean {
    return this.goals.delete(id);
  }

  public getAllGoals(): SMARTGoalModel[] {
    return Array.from(this.goals.values());
  }

  // Action Plan operations
  public createActionPlan(planData: Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'>): ActionPlanModel {
    const plan = new ActionPlanModel(planData);
    this.actionPlans.set(plan.id, plan);
    return plan;
  }

  public getActionPlanById(id: string): ActionPlanModel | undefined {
    return this.actionPlans.get(id);
  }

  public getActionPlanByGoalId(goalId: string): ActionPlanModel | undefined {
    for (const plan of Array.from(this.actionPlans.values())) {
      if (plan.goalId === goalId) {
        return plan;
      }
    }
    return undefined;
  }

  public getActionPlansByUserId(userId: string): ActionPlanModel[] {
    return Array.from(this.actionPlans.values()).filter(plan => plan.userId === userId);
  }

  public updateActionPlan(id: string, updates: Partial<Omit<ActionPlan, 'id' | 'createdAt'>>): ActionPlanModel | undefined {
    const plan = this.actionPlans.get(id);
    if (plan) {
      Object.assign(plan, updates);
      plan.updatedAt = new Date();
      return plan;
    }
    return undefined;
  }

  public deleteActionPlan(id: string): boolean {
    return this.actionPlans.delete(id);
  }

  public getAllActionPlans(): ActionPlanModel[] {
    return Array.from(this.actionPlans.values());
  }

  // Utility methods
  public clear(): void {
    this.users.clear();
    this.goals.clear();
    this.actionPlans.clear();
  }

  public getStats(): { users: number; goals: number; actionPlans: number } {
    return {
      users: this.users.size,
      goals: this.goals.size,
      actionPlans: this.actionPlans.size
    };
  }
}