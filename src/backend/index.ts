// Backend entry point for the AI Life Assistant
import { database } from '../database';
import { UserModel, SMARTGoalModel, ActionPlanModel } from '../models';
import { GoalStatus, Priority, LifeDomain } from '../types';

console.log('AI Life Assistant - MVP Setup Complete');
console.log('Database initialized:', database.getStats());

// Export main components for external use
export { database } from '../database';
export * from '../models';
export * from '../types';

// Example usage demonstration
export function createSampleData() {
  // Create a sample user
  const user = database.createUser({
    email: 'user@example.com',
    name: 'Sample User',
    preferences: {
      timezone: 'UTC',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      energyPeakHours: ['09:00', '10:00', '14:00', '15:00'],
      preferredDomains: [LifeDomain.FITNESS, LifeDomain.LEARNING]
    }
  });

  // Create a sample SMART goal
  const goal = database.createGoal({
    userId: user.id,
    title: 'Learn TypeScript',
    description: 'Master TypeScript for better web development',
    specific: 'Complete a comprehensive TypeScript course and build 3 projects',
    measurable: [
      {
        name: 'Course Progress',
        unit: 'percentage',
        targetValue: 100,
        currentValue: 0
      },
      {
        name: 'Projects Completed',
        unit: 'count',
        targetValue: 3,
        currentValue: 0
      }
    ],
    achievable: {
      difficultyLevel: 'moderate',
      requiredResources: ['Time', 'Computer', 'Internet'],
      estimatedEffort: { hours: 40, weeks: 8 }
    },
    relevant: {
      personalValues: ['Growth', 'Career Development'],
      lifeAreas: [LifeDomain.LEARNING, LifeDomain.CAREER],
      motivation: 'Improve programming skills for career advancement'
    },
    timeBound: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks from now
      milestones: [
        new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000), // 2 weeks
        new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks
        new Date(Date.now() + 6 * 7 * 24 * 60 * 60 * 1000)  // 6 weeks
      ]
    },
    status: GoalStatus.ACTIVE
  });

  // Create a sample action plan
  const actionPlan = database.createActionPlan({
    goalId: goal.id,
    userId: user.id,
    milestones: [
      {
        id: 'milestone-1',
        title: 'Complete TypeScript Basics',
        description: 'Finish first 25% of course covering basic types and syntax',
        dueDate: new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000),
        completed: false
      }
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Set up development environment',
        description: 'Install Node.js, TypeScript, and VS Code extensions',
        priority: Priority.HIGH,
        estimatedDuration: { hours: 2 },
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        completed: false,
        dependencies: []
      }
    ],
    dependencies: [],
    estimatedDuration: { hours: 40, weeks: 8 },
    requiredResources: [
      {
        id: 'resource-1',
        name: 'Study Time',
        type: 'time',
        amount: 5,
        unit: 'hours per week',
        available: true
      }
    ]
  });

  return { user, goal, actionPlan };
}

// Run sample data creation if this is the main module
if (require.main === module) {
  const sampleData = createSampleData();
  console.log('Sample data created:');
  console.log('- User:', sampleData.user.name);
  console.log('- Goal:', sampleData.goal.title);
  console.log('- Action Plan:', sampleData.actionPlan.tasks.length, 'tasks');
  console.log('Final database stats:', database.getStats());
}