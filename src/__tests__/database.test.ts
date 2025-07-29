import { database, DatabaseFactory } from '../database';
import { GoalStatus, LifeDomain } from '../types';

describe('InMemoryDatabase', () => {
  beforeEach(() => {
    database.clear();
  });

  describe('User operations', () => {
    it('should create and retrieve users', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: ['09:00'],
          preferredDomains: [LifeDomain.FITNESS]
        }
      };

      const user = database.createUser(userData);
      expect(user.id).toBeDefined();

      const retrievedUser = database.getUserById(user.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser!.email).toBe(userData.email);

      const userByEmail = database.getUserByEmail(userData.email);
      expect(userByEmail).toBeDefined();
      expect(userByEmail!.id).toBe(user.id);
    });

    it('should update and delete users', () => {
      const user = database.createUser({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: [],
          preferredDomains: []
        }
      });

      const updated = database.updateUser(user.id, { name: 'Updated User' });
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated User');

      const deleted = database.deleteUser(user.id);
      expect(deleted).toBe(true);

      const notFound = database.getUserById(user.id);
      expect(notFound).toBeUndefined();
    });
  });

  describe('Goal operations', () => {
    it('should create and retrieve goals', () => {
      const user = database.createUser({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: [],
          preferredDomains: []
        }
      });

      const goalData = {
        userId: user.id,
        title: 'Test Goal',
        description: 'A test goal',
        specific: 'Learn something specific',
        measurable: [],
        achievable: {
          difficultyLevel: 'easy' as const,
          requiredResources: [],
          estimatedEffort: { hours: 1 }
        },
        relevant: {
          personalValues: [],
          lifeAreas: [],
          motivation: 'Test motivation'
        },
        timeBound: {
          startDate: new Date(),
          endDate: new Date(),
          milestones: []
        },
        status: GoalStatus.DRAFT
      };

      const goal = database.createGoal(goalData);
      expect(goal.id).toBeDefined();

      const retrievedGoal = database.getGoalById(goal.id);
      expect(retrievedGoal).toBeDefined();
      expect(retrievedGoal!.title).toBe(goalData.title);

      const userGoals = database.getGoalsByUserId(user.id);
      expect(userGoals).toHaveLength(1);
      expect(userGoals[0].id).toBe(goal.id);
    });
  });

  describe('Action Plan operations', () => {
    it('should create and retrieve action plans', () => {
      const user = database.createUser({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: [],
          preferredDomains: []
        }
      });

      const goal = database.createGoal({
        userId: user.id,
        title: 'Test Goal',
        description: 'Test',
        specific: 'Test',
        measurable: [],
        achievable: {
          difficultyLevel: 'easy',
          requiredResources: [],
          estimatedEffort: { hours: 1 }
        },
        relevant: {
          personalValues: [],
          lifeAreas: [],
          motivation: 'Test'
        },
        timeBound: {
          startDate: new Date(),
          endDate: new Date(),
          milestones: []
        },
        status: GoalStatus.DRAFT
      });

      const planData = {
        goalId: goal.id,
        userId: user.id,
        milestones: [],
        tasks: [],
        dependencies: [],
        estimatedDuration: { hours: 10 },
        requiredResources: []
      };

      const plan = database.createActionPlan(planData);
      expect(plan.id).toBeDefined();

      const retrievedPlan = database.getActionPlanById(plan.id);
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan!.goalId).toBe(goal.id);

      const planByGoal = database.getActionPlanByGoalId(goal.id);
      expect(planByGoal).toBeDefined();
      expect(planByGoal!.id).toBe(plan.id);

      const userPlans = database.getActionPlansByUserId(user.id);
      expect(userPlans).toHaveLength(1);
      expect(userPlans[0].id).toBe(plan.id);
    });
  });

  describe('Database stats and utilities', () => {
    it('should provide accurate stats', () => {
      let stats = database.getStats();
      expect(stats.users).toBe(0);
      expect(stats.goals).toBe(0);
      expect(stats.actionPlans).toBe(0);

      database.createUser({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: [],
          preferredDomains: []
        }
      });

      stats = database.getStats();
      expect(stats.users).toBe(1);
    });

    it('should clear all data', () => {
      database.createUser({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: [],
          preferredDomains: []
        }
      });

      let stats = database.getStats();
      expect(stats.users).toBe(1);

      database.clear();
      stats = database.getStats();
      expect(stats.users).toBe(0);
    });
  });
});