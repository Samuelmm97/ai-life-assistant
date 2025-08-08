import React, { useState, useEffect } from 'react';
import { GoalStatus, LifeDomain, SMARTGoal, ActionPlan } from '../types';
import { GoalService } from '../services/GoalService';
import { ProgressReport, Adjustment } from '../services/SMARTGoalEngine';
import { SMARTGoalOrchestrationService } from '../services/SMARTGoalOrchestrationService';

interface GoalManagerProps {
  goals: SMARTGoal[];
  onUpdateGoal: (goalId: string, updates: Partial<SMARTGoal>) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalManager: React.FC<GoalManagerProps> = ({ goals, onUpdateGoal, onDeleteGoal }) => {
  const [selectedGoal, setSelectedGoal] = useState<SMARTGoal | null>(null);
  const [editingProgress, setEditingProgress] = useState<{ [key: string]: number }>({});
  const [goalService] = useState(() => new GoalService());
  const [orchestrationService] = useState(() => new SMARTGoalOrchestrationService());
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'action-plan' | 'adjustments' | 'adk-insights'>('details');
  const [adkInsights, setAdkInsights] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Load system status on component mount
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const status = await orchestrationService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Error loading system status:', error);
      }
    };

    loadSystemStatus();
  }, [orchestrationService]);

  // Load additional data when a goal is selected
  useEffect(() => {
    const loadGoalData = async () => {
      if (!selectedGoal) {
        setProgressReport(null);
        setAdjustments([]);
        setActionPlan(null);
        setAdkInsights(null);
        return;
      }

      try {
        // Use orchestration service for enhanced progress tracking
        const progressResult = await orchestrationService.getGoalProgress(selectedGoal.id);
        setProgressReport(progressResult.progress);

        // Store ADK insights if available
        if (progressResult.method === 'adk') {
          setAdkInsights({
            insights: progressResult.insights,
            recommendations: progressResult.recommendations,
            method: progressResult.method
          });
        }

        // Load adjustments (fallback to traditional service)
        const goalAdjustments = await goalService.getGoalAdjustments(selectedGoal.id);
        setAdjustments(goalAdjustments);

        // Load action plan (fallback to traditional service)
        const plan = await goalService.getGoalActionPlan(selectedGoal.id);
        setActionPlan(plan);
      } catch (error) {
        console.error('Error loading goal data:', error);
      }
    };

    loadGoalData();
  }, [selectedGoal, goalService, orchestrationService]);

  const handleStatusChange = async (goalId: string, newStatus: GoalStatus) => {
    try {
      await onUpdateGoal(goalId, { status: newStatus });
      
      // Update the selected goal immediately
      if (selectedGoal && selectedGoal.id === goalId) {
        setSelectedGoal(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      // Show confirmation message
      const statusMessages = {
        [GoalStatus.ACTIVE]: 'Goal activated! 🚀',
        [GoalStatus.COMPLETED]: 'Congratulations! Goal completed! 🎉',
        [GoalStatus.PAUSED]: 'Goal paused ⏸️',
        [GoalStatus.CANCELLED]: 'Goal cancelled ❌',
        [GoalStatus.DRAFT]: 'Goal moved to draft 📝'
      };
      
      // You could add a toast notification here
      console.log(statusMessages[newStatus]);
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const handleProgressUpdate = async (goalId: string, metricIndex: number, newValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const metric = goal.measurable[metricIndex];
    if (!metric) return;

    try {
      await goalService.updateMetricProgress(goalId, metric.name, newValue);
      
      const updatedMeasurable = goal.measurable.map((m, index) => 
        index === metricIndex ? { ...m, currentValue: newValue } : m
      );

      // Update the parent component
      await onUpdateGoal(goalId, { measurable: updatedMeasurable });
      
      // Update the selected goal immediately for real-time UI updates
      if (selectedGoal && selectedGoal.id === goalId) {
        setSelectedGoal(prev => prev ? { ...prev, measurable: updatedMeasurable } : null);
      }
      
      // Refresh progress report
      const progress = await goalService.getGoalProgress(goalId);
      setProgressReport(progress);
      
      // Refresh adjustments
      const goalAdjustments = await goalService.getGoalAdjustments(goalId);
      setAdjustments(goalAdjustments);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleDeleteConfirm = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      onDeleteGoal(goalId);
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
      }
    }
  };

  const getProgressPercentage = (goal: SMARTGoal): number => {
    if (goal.status === GoalStatus.COMPLETED) return 100;
    if (goal.measurable.length === 0) return 0;
    
    const totalProgress = goal.measurable.reduce((sum, metric) => {
      const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return totalProgress / goal.measurable.length;
  };

  const getDaysRemaining = (endDate: Date): number => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderDetailsTab = () => (
    <>
      <div className="details-section">
        <h4>Description</h4>
        <p>{selectedGoal!.description || 'No description provided'}</p>
      </div>

      <div className="details-section">
        <h4>Specific Goal</h4>
        <p>{selectedGoal!.specific}</p>
      </div>

      <div className="details-section">
        <h4>Measurable Metrics</h4>
        {selectedGoal!.measurable.length === 0 ? (
          <p>No metrics defined</p>
        ) : (
          <div className="metrics-list">
            {selectedGoal!.measurable.map((metric, index) => {
              const progress = metric.targetValue > 0 ? (metric.currentValue / metric.targetValue) * 100 : 0;
              
              return (
                <div key={index} className="metric-item">
                  <div className="metric-header">
                    <span className="metric-name">{metric.name}</span>
                    <span className="metric-progress">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="metric-controls">
                    <input
                      type="number"
                      value={editingProgress[`${selectedGoal!.id}-${index}`] ?? metric.currentValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingProgress(prev => ({
                        ...prev,
                        [`${selectedGoal!.id}-${index}`]: Number(e.target.value)
                      }))}
                      onBlur={() => {
                        const newValue = editingProgress[`${selectedGoal!.id}-${index}`];
                        if (newValue !== undefined && newValue !== metric.currentValue) {
                          handleProgressUpdate(selectedGoal!.id, index, newValue);
                        }
                        setEditingProgress(prev => {
                          const updated = { ...prev };
                          delete updated[`${selectedGoal!.id}-${index}`];
                          return updated;
                        });
                      }}
                      min="0"
                      max={metric.targetValue}
                    />
                    <span>/ {metric.targetValue} {metric.unit}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="details-section">
        <h4>Timeline</h4>
        <div className="timeline-info">
          <p><strong>Start:</strong> {formatDate(selectedGoal!.timeBound.startDate)}</p>
          <p><strong>End:</strong> {formatDate(selectedGoal!.timeBound.endDate)}</p>
          <p><strong>Days Remaining:</strong> {getDaysRemaining(selectedGoal!.timeBound.endDate)}</p>
          {selectedGoal!.timeBound.milestones.length > 0 && (
            <div className="milestones">
              <strong>Milestones:</strong>
              <ul>
                {selectedGoal!.timeBound.milestones.map((milestone, index) => (
                  <li key={index}>{formatDate(milestone)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="details-section">
        <h4>Achievability</h4>
        <p><strong>Difficulty:</strong> {selectedGoal!.achievable.difficultyLevel}</p>
        <p><strong>Estimated Effort:</strong> {selectedGoal!.achievable.estimatedEffort.hours} hours
          {selectedGoal!.achievable.estimatedEffort.weeks && ` over ${selectedGoal!.achievable.estimatedEffort.weeks} weeks`}
        </p>
        {selectedGoal!.achievable.requiredResources.length > 0 && (
          <div>
            <strong>Required Resources:</strong>
            <ul>
              {selectedGoal!.achievable.requiredResources.map((resource, index) => (
                <li key={index}>{resource}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="details-section">
        <h4>Relevance</h4>
        <p><strong>Motivation:</strong> {selectedGoal!.relevant.motivation}</p>
        {selectedGoal!.relevant.personalValues.length > 0 && (
          <p><strong>Personal Values:</strong> {selectedGoal!.relevant.personalValues.join(', ')}</p>
        )}
        {selectedGoal!.relevant.lifeAreas.length > 0 && (
          <div className="life-areas">
            <strong>Life Areas:</strong>
            <div className="domain-tags">
              {selectedGoal!.relevant.lifeAreas.map((domain: LifeDomain) => (
                <span key={domain} className="domain-tag">{domain}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="details-section">
        <h4>Goal Information</h4>
        <p><strong>Created:</strong> {formatDate(selectedGoal!.createdAt)}</p>
        <p><strong>Last Updated:</strong> {formatDate(selectedGoal!.updatedAt)}</p>
      </div>
    </>
  );

  const renderProgressTab = () => (
    <>
      {progressReport ? (
        <>
          <div className="progress-overview">
            <div className="progress-stats">
              <div className="stat-item">
                <h4>Overall Progress</h4>
                <div className="stat-value">{progressReport.overallProgress.toFixed(1)}%</div>
              </div>
              <div className="stat-item">
                <h4>Time Progress</h4>
                <div className="stat-value">{progressReport.timeProgress.toFixed(1)}%</div>
              </div>
              <div className="stat-item">
                <h4>Days Remaining</h4>
                <div className="stat-value">{progressReport.daysRemaining}</div>
              </div>
              <div className="stat-item">
                <h4>On Track</h4>
                <div className={`stat-value ${progressReport.isOnTrack ? 'positive' : 'negative'}`}>
                  {progressReport.isOnTrack ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <h4>Metric Progress</h4>
            <div className="metric-progress-list">
              {Object.entries(progressReport.metricProgress).map(([metricName, progress]) => (
                <div key={metricName} className="metric-progress-item">
                  <div className="metric-progress-header">
                    <span>{metricName}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {progressReport.recommendations.length > 0 && (
            <div className="progress-section">
              <h4>Recommendations</h4>
              <ul className="recommendations-list">
                {progressReport.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="loading">Loading progress data...</div>
      )}
    </>
  );

  const renderActionPlanTab = () => (
    <>
      {actionPlan ? (
        <>
          <div className="action-plan-overview">
            <h4>Action Plan Overview</h4>
            <p><strong>Total Tasks:</strong> {actionPlan.tasks.length}</p>
            <p><strong>Completed Tasks:</strong> {actionPlan.tasks.filter(t => t.completed).length}</p>
            <p><strong>Total Milestones:</strong> {actionPlan.milestones.length}</p>
            <p><strong>Completed Milestones:</strong> {actionPlan.milestones.filter(m => m.completed).length}</p>
          </div>

          <div className="action-plan-section">
            <h4>Milestones</h4>
            {actionPlan.milestones.length === 0 ? (
              <p>No milestones defined</p>
            ) : (
              <div className="milestones-list">
                {actionPlan.milestones.map((milestone) => (
                  <div key={milestone.id} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                    <div className="milestone-header">
                      <h5>{milestone.title}</h5>
                      <span className="milestone-date">{formatDate(milestone.dueDate)}</span>
                    </div>
                    <p>{milestone.description}</p>
                    {milestone.completed && milestone.completedAt && (
                      <p className="completion-info">✅ Completed on {formatDate(milestone.completedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-plan-section">
            <h4>Tasks</h4>
            {actionPlan.tasks.length === 0 ? (
              <p>No tasks defined</p>
            ) : (
              <div className="tasks-list">
                {actionPlan.tasks.map((task) => (
                  <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <div className="task-header">
                      <h5>{task.title}</h5>
                      <div className="task-meta">
                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                        <span className="task-date">{formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                    <p>{task.description}</p>
                    <p><strong>Estimated Duration:</strong> {task.estimatedDuration.hours} hours</p>
                    {task.completed && task.completedAt && (
                      <p className="completion-info">✅ Completed on {formatDate(task.completedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-plan-section">
            <h4>Required Resources</h4>
            {actionPlan.requiredResources.length === 0 ? (
              <p>No resources defined</p>
            ) : (
              <div className="resources-list">
                {actionPlan.requiredResources.map((resource) => (
                  <div key={resource.id} className="resource-item">
                    <h5>{resource.name}</h5>
                    <p><strong>Type:</strong> {resource.type}</p>
                    <p><strong>Amount:</strong> {resource.amount} {resource.unit}</p>
                    <p><strong>Available:</strong> {resource.available ? '✅ Yes' : '❌ No'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="loading">Loading action plan...</div>
      )}
    </>
  );

  const renderAdjustmentsTab = () => (
    <>
      {adjustments.length > 0 ? (
        <>
          <div className="adjustments-overview">
            <h4>Suggested Adjustments</h4>
            <p>Based on your current progress, here are some recommendations to help you achieve your goal:</p>
          </div>

          <div className="adjustments-list">
            {adjustments.map((adjustment, index) => (
              <div key={index} className={`adjustment-item ${adjustment.impact}`}>
                <div className="adjustment-header">
                  <h5>{adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)} Adjustment</h5>
                  <span className={`impact-badge ${adjustment.impact}`}>
                    {adjustment.impact} impact
                  </span>
                </div>
                <p className="adjustment-description">{adjustment.description}</p>
                <p className="adjustment-recommendation">
                  <strong>Recommendation:</strong> {adjustment.recommendation}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-adjustments">
          <h4>No Adjustments Needed</h4>
          <p>Your goal is progressing well! Keep up the good work.</p>
        </div>
      )}
    </>
  );

  const renderADKInsightsTab = () => (
    <>
      {adkInsights ? (
        <>
          <div className="adk-insights-overview">
            <h4>AI-Powered Insights</h4>
            <p>Advanced analysis from our AI agents to help optimize your goal achievement:</p>
            <div className="analysis-method">
              <span className="method-badge adk">
                🤖 ADK Analysis
              </span>
            </div>
          </div>

          {adkInsights.insights && adkInsights.insights.length > 0 && (
            <div className="insights-section">
              <h5>📊 Key Insights</h5>
              <div className="insights-list">
                {adkInsights.insights.map((insight: string, index: number) => (
                  <div key={index} className="insight-item">
                    <div className="insight-icon">💡</div>
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adkInsights.recommendations && adkInsights.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h5>🎯 AI Recommendations</h5>
              <div className="recommendations-list">
                {adkInsights.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-icon">🚀</div>
                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {systemStatus && (
            <div className="system-status-section">
              <h5>🔧 System Status</h5>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">ADK Agents:</span>
                  <span className={`status-value ${systemStatus.adkInitialized ? 'active' : 'inactive'}`}>
                    {systemStatus.adkInitialized ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Capabilities:</span>
                  <span className="status-value">
                    {systemStatus.capabilities?.join(', ') || 'Basic'}
                  </span>
                </div>
                {systemStatus.systemHealth && (
                  <div className="status-item">
                    <span className="status-label">Health:</span>
                    <span className={`status-value ${systemStatus.systemHealth.status === 'healthy' ? 'active' : 'inactive'}`}>
                      {systemStatus.systemHealth.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-adk-insights">
          <h4>AI Insights Unavailable</h4>
          <p>
            {systemStatus?.adkInitialized
              ? 'No AI insights available for this goal yet. Try updating your progress or refreshing the data.'
              : 'ADK agents are not initialized. AI insights require the advanced agent system to be active.'
            }
          </p>
          {!systemStatus?.adkInitialized && (
            <div className="adk-status-info">
              <p><strong>Available capabilities:</strong> {systemStatus?.capabilities?.join(', ') || 'Basic goal management'}</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="goal-manager">
      <div className="manager-header">
        <h2>Manage Your Goals</h2>
        <p>View, edit, and track progress on all your goals</p>
      </div>

      <div className="manager-content">
        <div className="goals-list-panel">
          <h3>Your Goals ({goals.length})</h3>
          {goals.length === 0 ? (
            <div className="empty-state">
              <p>No goals created yet</p>
            </div>
          ) : (
            <div className="goals-list">
              {goals.map(goal => {
                const progress = getProgressPercentage(goal);
                const daysRemaining = getDaysRemaining(goal.timeBound.endDate);
                
                return (
                  <div 
                    key={goal.id} 
                    className={`goal-item ${selectedGoal?.id === goal.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <div className="goal-item-header">
                      <h4>{goal.title}</h4>
                      <span className={`status-badge ${goal.status}`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="goal-item-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="goal-item-meta">
                      <span className={`days-remaining ${daysRemaining < 0 ? 'overdue' : ''}`}>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="goal-details-panel">
          {selectedGoal ? (
            <div className="goal-details">
              <div className="details-header">
                <h3>{selectedGoal.title}</h3>
                <div className="goal-actions">
                  <div className="status-change-section">
                    <label htmlFor="status-select" className="status-label">
                      Goal Status:
                    </label>
                    <select
                      id="status-select"
                      value={selectedGoal.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(selectedGoal.id, e.target.value as GoalStatus)}
                      className={`status-select status-${selectedGoal.status}`}
                    >
                      <option value={GoalStatus.DRAFT}>📝 Draft</option>
                      <option value={GoalStatus.ACTIVE}>🚀 Active</option>
                      <option value={GoalStatus.PAUSED}>⏸️ Paused</option>
                      <option value={GoalStatus.COMPLETED}>🎉 Completed</option>
                      <option value={GoalStatus.CANCELLED}>❌ Cancelled</option>
                    </select>
                    <div className="status-hint">
                      <small>Change status to track your goal's progress</small>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteConfirm(selectedGoal.id)}
                    className="delete-button"
                    title="Delete this goal permanently"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  📋 Details
                </button>
                <button 
                  className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                  onClick={() => setActiveTab('progress')}
                >
                  📊 Progress
                </button>
                <button 
                  className={`tab-button ${activeTab === 'action-plan' ? 'active' : ''}`}
                  onClick={() => setActiveTab('action-plan')}
                >
                  📝 Action Plan
                </button>
                <button 
                  className={`tab-button ${activeTab === 'adjustments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('adjustments')}
                >
                  🔧 Adjustments
                </button>
                {systemStatus?.adkInitialized && (
                  <button
                    className={`tab-button adk-insights ${activeTab === 'adk-insights' ? 'active' : ''}`}
                    onClick={() => setActiveTab('adk-insights')}
                  >
                    🤖 AI Insights
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'details' && (
                  <div className="details-content">{renderDetailsTab()}</div>
                )}
                {activeTab === 'progress' && (
                  <div className="progress-content">{renderProgressTab()}</div>
                )}
                {activeTab === 'action-plan' && (
                  <div className="action-plan-content">{renderActionPlanTab()}</div>
                )}
                {activeTab === 'adjustments' && (
                  <div className="adjustments-content">{renderAdjustmentsTab()}</div>
                )}
                {activeTab === 'adk-insights' && systemStatus?.adkInitialized && (
                  <div className="adk-insights-content">{renderADKInsightsTab()}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select a goal to view details</h3>
              <p>Click on a goal from the list to see its details and manage progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};