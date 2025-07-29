// Export all models and their interfaces
export type { User, UserPreferences } from './User';
export { UserModel } from './User';
export { SMARTGoalModel } from './SMARTGoal';
export type {
  ActionPlan,
  Milestone,
  Task,
  Dependency,
  Resource
} from './ActionPlan';
export { ActionPlanModel } from './ActionPlan';
export { ScheduleEntryModel } from './ScheduleEntry';
export { CalendarConflictModel } from './CalendarConflict';