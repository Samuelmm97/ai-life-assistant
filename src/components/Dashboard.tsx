import React, { useState, useEffect } from 'react';
import { GoalStatus, SMARTGoal } from '../types';
import { SMARTGoalOrchestrationService } from '../services/SMARTGoalOrchestrationService';

interface DashboardProps {
  goals: SMARTGoal[];
  onGoalClick?: (goalId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ goals, onGoalClick }) => {
  const [orchestrationService] = useState(() => new SMARTGoalOrchestrationService());
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load enhanced dashboard data if ADK is available
  useEffect(() => {
    const loadEnhancedData = async () => {
      if (goals.length === 0) return;

      setLoading(true);
      try {
        // Get system status
        const status = await orchestrationService.getSystemStatus();
        setSystemStatus(status);

        // If ADK is available, get enhanced data
        if (status.adkInitialized && goals.length > 0) {
          const userId = goals[0].userId; // Assume all goals belong to same user
          const dashboardResult = await orchestrationService.getDashboardData(userId);

          if (dashboardResult.method === 'adk') {
            setEnhancedData(dashboardResult.data);
          }
        }
      } catch (error) {
        console.error('Error loading enhanced dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEnhancedData();
  }, [goals, orchestrationService]);
  const activeGoals = goals.filter(goal => goal.status === GoalStatus.ACTIVE);
  const completedGoals = goals.filter(goal => goal.status === GoalStatus.COMPLETED);

  const getProgressForGoal = (goal: SMARTGoal): number => {
    if (goal.status === GoalStatus.COMPLETED) return 100;
    if (goal.measurable.length === 0) return 0;
    
    const totalProgress = goal.measurable.reduce((sum, metric) => {
      const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return totalProgress / goal.measurable.length;
  };

  // Calculate overall progress based on individual goal progress, not just completed goals
  const calculateOverallProgress = () => {
    if (goals.length === 0) return 0;

    const totalProgress = goals.reduce((sum, goal) => {
      if (goal.status === GoalStatus.COMPLETED) return sum + 100;
      if (goal.status === GoalStatus.CANCELLED) return sum + 0;

      // Calculate progress for active/paused goals
      const goalProgress = getProgressForGoal(goal);
      return sum + goalProgress;
    }, 0);

    return totalProgress / goals.length;
  };

  const totalProgress = calculateOverallProgress();

  const getDaysRemaining = (endDate: Date): number => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Life Goals Dashboard</h2>
        <p>Track your progress and stay motivated on your journey to success</p>

        {/* System Status Indicator */}
        {systemStatus && (
          <div className={`system-status-banner ${systemStatus.adkInitialized ? 'adk-active' : 'adk-inactive'}`}>
            <div className="status-content">
              <span className="status-icon">
                {systemStatus.adkInitialized ? '🤖' : '⚙️'}
              </span>
              <div className="status-info">
                <span className="status-title">
                  {systemStatus.adkInitialized ? 'AI-Enhanced Dashboard' : 'Standard Dashboard'}
                </span>
                <span className="status-subtitle">
                  {systemStatus.adkInitialized
                    ? 'Advanced AI insights and recommendations available'
                    : 'Basic goal tracking and analytics'
                  }
                </span>
              </div>
            </div>
            {loading && (
              <div className="loading-indicator">
                <span>🔄</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Goals</h3>
          <div className="stat-number">{goals.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Goals</h3>
          <div className="stat-number">{activeGoals.length}</div>
        </div>
        <div className="stat-card">
          <h3>Completed Goals</h3>
          <div className="stat-number">{completedGoals.length}</div>
        </div>
        <div className="stat-card">
          <h3>Overall Progress</h3>
          <div className="stat-number">{totalProgress.toFixed(1)}%</div>
        </div>
      </div>

      {/* Enhanced AI Insights */}
      {enhancedData && systemStatus?.adkInitialized && (
        <div className="enhanced-insights-section">
          <h3>🤖 AI Insights & Recommendations</h3>

          {enhancedData.insights && enhancedData.insights.length > 0 && (
            <div className="insights-grid">
              <div className="insight-card">
                <h4>📊 Key Insights</h4>
                <ul>
                  {enhancedData.insights.slice(0, 3).map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>

              {enhancedData.recommendations && enhancedData.recommendations.length > 0 && (
                <div className="insight-card">
                  <h4>🎯 Recommendations</h4>
                  <ul>
                    {enhancedData.recommendations.slice(0, 3).map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {enhancedData.systemHealth && (
            <div className="system-health-summary">
              <h4>🔧 System Health</h4>
              <div className="health-indicators">
                <span className={`health-indicator ${enhancedData.systemHealth.status === 'healthy' ? 'healthy' : 'warning'}`}>
                  Status: {enhancedData.systemHealth.status}
                </span>
                {enhancedData.systemHealth.agents && (
                  <span className="agents-count">
                    Active Agents: {Object.keys(enhancedData.systemHealth.agents).length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="empty-state">
          <h3>No goals yet</h3>
          <p>Start your journey by creating your first SMART goal!</p>
          <div className="empty-icon">🎯</div>
        </div>
      ) : (
        <div className="goals-overview">
          <h3>Recent Goals</h3>
          <div className="goals-list">
            {goals.slice(0, 5).map(goal => {
              const progress = getProgressForGoal(goal);
              const daysRemaining = getDaysRemaining(goal.timeBound.endDate);
              
              return (
                <div
                  key={goal.id}
                  className="goal-card clickable"
                  onClick={() => onGoalClick && onGoalClick(goal.id)}
                  title="Click to view and manage this goal"
                >
                  <div className="goal-header">
                    <h4>{goal.title}</h4>
                    <span className={`status-badge ${goal.status}`}>
                      {goal.status}
                    </span>
                  </div>
                  <p className="goal-description">{goal.description}</p>
                  
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress.toFixed(1)}%</span>
                  </div>
                  
                  <div className="goal-meta">
                    <span className={`days-remaining ${daysRemaining < 0 ? 'overdue' : ''}`}>
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                    </span>
                    <span className="domain-tags">
                      {goal.relevant.lifeAreas.map(domain => (
                        <span key={domain} className="domain-tag">{domain}</span>
                      ))}
                    </span>
                  </div>
                  <div className="goal-click-hint">
                    <span>👆 Click to manage</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};