import { UserModel, SMARTGoalModel, ActionPlanModel } from '../models';
import { GoalStatus, Priority, LifeDomain } from '../types';
import { database } from '../database';

describe('Basic Data Models', () => {
  beforeEach(() => {
    database.clear();
  });

  describe('UserModel', () => {
    it('should create a user with all required fields', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: ['09:00', '14:00'],
          preferredDomains: [LifeDomain.FITNESS]
        }
      };

      const user = new UserModel(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update user data correctly', () => {
      const user = new UserModel({
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          timezone: 'UTC',
          workingHours: { start: '09:00', end: '17:00' },
          energyPeakHours: ['09:00'],
          preferredDomains: []
        }
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        user.update({ name: 'Updated User' });
        expect(user.name).toBe('Updated User');
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('SMARTGoalModel', () => {
    it('should create a SMART goal with all required fields', () => {
      const goalData = {
        userId: 'user-123',
        title: 'Test Goal',
        description: 'A test goal',
        specific: 'Learn TypeScript basics',
        measurable: [{
          name: 'Progress',
          unit: 'percentage',
          targetValue: 100,
          currentValue: 0
        }],
        achievable: {
          difficultyLevel: 'moderate' as const,
          requiredResources: ['Time'],
          estimatedEffort: { hours: 10 }
        },
        relevant: {
          personalValues: ['Growth'],
          lifeAreas: [LifeDomain.LEARNING],
          motivation: 'Career development'
        },
        timeBound: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          milestones: []
        },
        status: GoalStatus.DRAFT
      };

      const goal = new SMARTGoalModel(goalData);

      expect(goal.id).toBeDefined();
      expect(goal.title).toBe(goalData.title);
      expect(goal.status).toBe(GoalStatus.DRAFT);
      expect(goal.createdAt).toBeInstanceOf(Date);
    });

    it('should handle status transitions correctly', () => {
      const goal = new SMARTGoalModel({
        userId: 'user-123',
        title: 'Test Goal',
        description: 'Test',
        specific: 'Test specific',
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

      goal.activate();
      expect(goal.status).toBe(GoalStatus.ACTIVE);

      goal.complete();
      expect(goal.status).toBe(GoalStatus.COMPLETED);
    });
  });

  describe('ActionPlanModel', () => {
    it('should create an action plan with tasks and milestones', () => {
      const planData = {
        goalId: 'goal-123',
        userId: 'user-123',
        milestones: [],
        tasks: [],
        dependencies: [],
        estimatedDuration: { hours: 10 },
        requiredResources: []
      };

      const plan = new ActionPlanModel(planData);

      expect(plan.id).toBeDefined();
      expect(plan.goalId).toBe(planData.goalId);
      expect(plan.tasks).toEqual([]);
      expect(plan.milestones).toEqual([]);
    });

    it('should add and complete tasks correctly', () => {
      const plan = new ActionPlanModel({
        goalId: 'goal-123',
        userId: 'user-123',
        milestones: [],
        tasks: [],
        dependencies: [],
        estimatedDuration: { hours: 10 },
        requiredResources: []
      });

      const task = plan.addTask({
        title: 'Test Task',
        description: 'A test task',
        priority: Priority.MEDIUM,
        estimatedDuration: { hours: 2 },
        dueDate: new Date(),
        completed: false,
        dependencies: []
      });

      expect(plan.tasks).toHaveLength(1);
      expect(task.id).toBeDefined();
      expect(task.completed).toBe(false);

      const completed = plan.completeTask(task.id);
      expect(completed).toBe(true);
      expect(task.completed).toBe(true);
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('should track progress correctly', () => {
      const plan = new ActionPlanModel({
        goalId: 'goal-123',
        userId: 'user-123',
        milestones: [],
        tasks: [],
        dependencies: [],
        estimatedDuration: { hours: 10 },
        requiredResources: []
      });

      // Add some tasks
      const task1 = plan.addTask({
        title: 'Task 1',
        description: 'First task',
        priority: Priority.HIGH,
        estimatedDuration: { hours: 1 },
        dueDate: new Date(),
        completed: false,
        dependencies: []
      });

      const task2 = plan.addTask({
        title: 'Task 2',
        description: 'Second task',
        priority: Priority.LOW,
        estimatedDuration: { hours: 1 },
        dueDate: new Date(),
        completed: false,
        dependencies: []
      });

      let progress = plan.getProgress();
      expect(progress.completedTasks).toBe(0);
      expect(progress.totalTasks).toBe(2);

      plan.completeTask(task1.id);
      progress = plan.getProgress();
      expect(progress.completedTasks).toBe(1);
      expect(progress.totalTasks).toBe(2);
    });
  });
});