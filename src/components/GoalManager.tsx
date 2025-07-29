import React, { useState } from 'react';
import { GoalStatus, LifeDomain, SMARTGoal } from '../types';

interface GoalManagerProps {
  goals: SMARTGoal[];
  onUpdateGoal: (goalId: string, updates: Partial<SMARTGoal>) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalManager: React.FC<GoalManagerProps> = ({ goals, onUpdateGoal, onDeleteGoal }) => {
  const [selectedGoal, setSelectedGoal] = useState<SMARTGoal | null>(null);
  const [editingProgress, setEditingProgress] = useState<{ [key: string]: number }>({});

  const handleStatusChange = (goalId: string, newStatus: GoalStatus) => {
    onUpdateGoal(goalId, { status: newStatus });
  };

  const handleProgressUpdate = (goalId: string, metricIndex: number, newValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMeasurable = goal.measurable.map((metric, index) => 
      index === metricIndex ? { ...metric, currentValue: newValue } : metric
    );

    onUpdateGoal(goalId, { measurable: updatedMeasurable });
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
                  <select
                    value={selectedGoal.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(selectedGoal.id, e.target.value as GoalStatus)}
                    className="status-select"
                  >
                    <option value={GoalStatus.DRAFT}>Draft</option>
                    <option value={GoalStatus.ACTIVE}>Active</option>
                    <option value={GoalStatus.PAUSED}>Paused</option>
                    <option value={GoalStatus.COMPLETED}>Completed</option>
                    <option value={GoalStatus.CANCELLED}>Cancelled</option>
                  </select>
                  <button 
                    onClick={() => handleDeleteConfirm(selectedGoal.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="details-section">
                <h4>Description</h4>
                <p>{selectedGoal.description || 'No description provided'}</p>
              </div>

              <div className="details-section">
                <h4>Specific Goal</h4>
                <p>{selectedGoal.specific}</p>
              </div>

              <div className="details-section">
                <h4>Measurable Metrics</h4>
                {selectedGoal.measurable.length === 0 ? (
                  <p>No metrics defined</p>
                ) : (
                  <div className="metrics-list">
                    {selectedGoal.measurable.map((metric, index) => {
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
                              value={editingProgress[`${selectedGoal.id}-${index}`] ?? metric.currentValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingProgress(prev => ({
                                ...prev,
                                [`${selectedGoal.id}-${index}`]: Number(e.target.value)
                              }))}
                              onBlur={() => {
                                const newValue = editingProgress[`${selectedGoal.id}-${index}`];
                                if (newValue !== undefined && newValue !== metric.currentValue) {
                                  handleProgressUpdate(selectedGoal.id, index, newValue);
                                }
                                setEditingProgress(prev => {
                                  const updated = { ...prev };
                                  delete updated[`${selectedGoal.id}-${index}`];
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
                  <p><strong>Start:</strong> {formatDate(selectedGoal.timeBound.startDate)}</p>
                  <p><strong>End:</strong> {formatDate(selectedGoal.timeBound.endDate)}</p>
                  <p><strong>Days Remaining:</strong> {getDaysRemaining(selectedGoal.timeBound.endDate)}</p>
                  {selectedGoal.timeBound.milestones.length > 0 && (
                    <div className="milestones">
                      <strong>Milestones:</strong>
                      <ul>
                        {selectedGoal.timeBound.milestones.map((milestone, index) => (
                          <li key={index}>{formatDate(milestone)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h4>Achievability</h4>
                <p><strong>Difficulty:</strong> {selectedGoal.achievable.difficultyLevel}</p>
                <p><strong>Estimated Effort:</strong> {selectedGoal.achievable.estimatedEffort.hours} hours
                  {selectedGoal.achievable.estimatedEffort.weeks && ` over ${selectedGoal.achievable.estimatedEffort.weeks} weeks`}
                </p>
                {selectedGoal.achievable.requiredResources.length > 0 && (
                  <div>
                    <strong>Required Resources:</strong>
                    <ul>
                      {selectedGoal.achievable.requiredResources.map((resource, index) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h4>Relevance</h4>
                <p><strong>Motivation:</strong> {selectedGoal.relevant.motivation}</p>
                {selectedGoal.relevant.personalValues.length > 0 && (
                  <p><strong>Personal Values:</strong> {selectedGoal.relevant.personalValues.join(', ')}</p>
                )}
                {selectedGoal.relevant.lifeAreas.length > 0 && (
                  <div className="life-areas">
                    <strong>Life Areas:</strong>
                    <div className="domain-tags">
                      {selectedGoal.relevant.lifeAreas.map((domain: LifeDomain) => (
                        <span key={domain} className="domain-tag">{domain}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h4>Goal Information</h4>
                <p><strong>Created:</strong> {formatDate(selectedGoal.createdAt)}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedGoal.updatedAt)}</p>
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