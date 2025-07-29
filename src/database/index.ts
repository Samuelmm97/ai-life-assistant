import { InMemoryDatabase } from './InMemoryDatabase';

// Database interface that both InMemory and SQLite implementations will follow
export interface Database {
  // User operations
  createUser(userData: any): any;
  getUserById(id: string): any;
  getUserByEmail(email: string): any;
  updateUser(id: string, updates: any): any;
  deleteUser(id: string): boolean;
  getAllUsers(): any[];

  // Goal operations
  createGoal(goalData: any): any;
  getGoalById(id: string): any;
  getGoalsByUserId(userId: string): any[];
  updateGoal(id: string, updates: any): any;
  deleteGoal(id: string): boolean;
  getAllGoals(): any[];

  // Action Plan operations
  createActionPlan(planData: any): any;
  getActionPlanById(id: string): any;
  getActionPlanByGoalId(goalId: string): any;
  getActionPlansByUserId(userId: string): any[];
  updateActionPlan(id: string, updates: any): any;
  deleteActionPlan(id: string): boolean;
  getAllActionPlans(): any[];

  // Utility methods
  clear(): void;
  getStats(): { users: number; goals: number; actionPlans: number };
}

export class DatabaseFactory {
  private static instance: Database;

  public static getInstance(type: 'memory' | 'sqlite' = 'memory'): Database {
    if (!DatabaseFactory.instance) {
      switch (type) {
        case 'memory':
          DatabaseFactory.instance = new InMemoryDatabase();
          break;
        case 'sqlite':
          // TODO: Implement SQLite database in future iterations
          throw new Error('SQLite database not yet implemented. Using in-memory database.');
        default:
          DatabaseFactory.instance = new InMemoryDatabase();
      }
    }
    return DatabaseFactory.instance;
  }

  public static reset(): void {
    DatabaseFactory.instance = null as any;
  }
}

// Export the database instance for easy access
export const database = DatabaseFactory.getInstance('memory');