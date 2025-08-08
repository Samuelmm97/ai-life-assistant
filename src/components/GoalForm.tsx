import React, { useState, useEffect } from 'react';
import { GoalStatus, LifeDomain, MeasurableMetric, SMARTGoal } from '../types';
import { GoalService } from '../services/GoalService';
import { ValidationResult } from '../services/SMARTGoalEngine';
import { SMARTGoalOrchestrationService } from '../services/SMARTGoalOrchestrationService';

interface GoalFormProps {
  onSubmit: (goal: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onCancel }) => {
  const [goalService] = useState(() => new GoalService());
  const [orchestrationService] = useState(() => new SMARTGoalOrchestrationService());
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [useADKAnalysis, setUseADKAnalysis] = useState(true);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Check system status on component mount
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const status = await orchestrationService.getSystemStatus();
        setSystemStatus(status);
        setUseADKAnalysis(status.adkInitialized);
      } catch (error) {
        console.error('Error checking system status:', error);
        setUseADKAnalysis(false);
      }
    };

    checkSystemStatus();
  }, [orchestrationService]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: [{ name: '', unit: '', targetValue: 0, currentValue: 0 }] as MeasurableMetric[],
    achievable: {
      difficultyLevel: 'moderate' as const,
      requiredResources: [''],
      estimatedEffort: { hours: 0, weeks: 0 }
    },
    relevant: {
      personalValues: [''],
      lifeAreas: [] as LifeDomain[],
      motivation: ''
    },
    timeBound: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      milestones: ['']
    },
    status: GoalStatus.ACTIVE
  });

  // Validate form data whenever it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formData.title && formData.specific) {
        setIsValidating(true);
        try {
          const goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
            ...formData,
            achievable: {
              ...formData.achievable,
              requiredResources: formData.achievable.requiredResources.filter(r => r.trim() !== '')
            },
            relevant: {
              ...formData.relevant,
              personalValues: formData.relevant.personalValues.filter(v => v.trim() !== '')
            },
            timeBound: {
              startDate: new Date(formData.timeBound.startDate),
              endDate: new Date(formData.timeBound.endDate),
              milestones: formData.timeBound.milestones
                .filter(m => m.trim() !== '')
                .map(m => new Date(m))
            }
          };

          // Use orchestration service for enhanced validation
          const validationResult = await orchestrationService.validateGoal(goalData);
          setValidation(validationResult.validation);
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setIsValidating(false);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData, orchestrationService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert form data to proper types
    const goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      achievable: {
        ...formData.achievable,
        requiredResources: formData.achievable.requiredResources.filter(r => r.trim() !== '')
      },
      relevant: {
        ...formData.relevant,
        personalValues: formData.relevant.personalValues.filter(v => v.trim() !== '')
      },
      timeBound: {
        startDate: new Date(formData.timeBound.startDate),
        endDate: new Date(formData.timeBound.endDate),
        milestones: formData.timeBound.milestones
          .filter(m => m.trim() !== '')
          .map(m => new Date(m))
      }
    };

    onSubmit(goalData);
  };

  const addMeasurableMetric = () => {
    setFormData(prev => ({
      ...prev,
      measurable: [...prev.measurable, { name: '', unit: '', targetValue: 0, currentValue: 0 }]
    }));
  };

  const updateMeasurableMetric = (index: number, field: keyof MeasurableMetric, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      measurable: prev.measurable.map((metric, i) =>
        i === index ? { ...metric, [field]: value } : metric
      )
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      achievable: {
        ...prev.achievable,
        requiredResources: [...prev.achievable.requiredResources, '']
      }
    }));
  };

  const updateResource = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      achievable: {
        ...prev.achievable,
        requiredResources: prev.achievable.requiredResources.map((resource, i) =>
          i === index ? value : resource
        )
      }
    }));
  };

  const addPersonalValue = () => {
    setFormData(prev => ({
      ...prev,
      relevant: {
        ...prev.relevant,
        personalValues: [...prev.relevant.personalValues, '']
      }
    }));
  };

  const updatePersonalValue = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      relevant: {
        ...prev.relevant,
        personalValues: prev.relevant.personalValues.map((val, i) =>
          i === index ? value : val
        )
      }
    }));
  };

  const toggleLifeArea = (domain: LifeDomain) => {
    setFormData(prev => ({
      ...prev,
      relevant: {
        ...prev.relevant,
        lifeAreas: prev.relevant.lifeAreas.includes(domain)
          ? prev.relevant.lifeAreas.filter(d => d !== domain)
          : [...prev.relevant.lifeAreas, domain]
      }
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      timeBound: {
        ...prev.timeBound,
        milestones: [...prev.timeBound.milestones, '']
      }
    }));
  };

  const updateMilestone = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeBound: {
        ...prev.timeBound,
        milestones: prev.timeBound.milestones.map((milestone, i) =>
          i === index ? value : milestone
        )
      }
    }));
  };

  // Helper function to get field validation status
  const getFieldValidation = (fieldName: string) => {
    if (!validation) return { hasError: false, hasWarning: false, messages: [] };

    const errors = validation.errors.filter(error =>
      error.toLowerCase().includes(fieldName.toLowerCase())
    );
    const warnings = validation.warnings.filter(warning =>
      warning.toLowerCase().includes(fieldName.toLowerCase())
    );

    return {
      hasError: errors.length > 0,
      hasWarning: warnings.length > 0,
      messages: [...errors, ...warnings]
    };
  };

  // Helper function to check if field is required and empty
  const isFieldRequired = (fieldName: string, value: any) => {
    const requiredFields = {
      title: !value || (typeof value === 'string' && value.trim().length === 0),
      specific: !value || (typeof value === 'string' && value.trim().length < 10),
      measurable: !value || !Array.isArray(value) || value.length === 0 || value.some((m: any) => !m.name || !m.unit || m.targetValue <= 0),
      endDate: !value || value === '',
      startDate: !value || value === ''
    };

    return requiredFields[fieldName as keyof typeof requiredFields] || false;
  };

  // Helper functions for progress tracking
  const getTotalRequiredFields = () => 5; // title, specific, measurable, startDate, endDate

  const getCompletedFieldsCount = () => {
    let completed = 0;

    // Check title
    if (formData.title && typeof formData.title === 'string' && formData.title.trim().length > 0) completed++;

    // Check specific (minimum 10 characters)
    if (formData.specific && typeof formData.specific === 'string' && formData.specific.trim().length >= 10) completed++;

    // Check measurable (at least one valid metric)
    if (Array.isArray(formData.measurable) && formData.measurable.length > 0 &&
      formData.measurable.some(m => m.name && m.unit && m.targetValue > 0)) completed++;

    // Check start date
    if (formData.timeBound.startDate && formData.timeBound.startDate !== '') completed++;

    // Check end date
    if (formData.timeBound.endDate && formData.timeBound.endDate !== '') completed++;

    return completed;
  };

  const getFormCompletionPercentage = () => {
    return Math.round((getCompletedFieldsCount() / getTotalRequiredFields()) * 100);
  };

  const ValidationFeedback: React.FC<{ validation: ValidationResult }> = ({ validation }) => (
    <div className={`validation-feedback ${validation.isValid ? 'valid' : 'invalid'}`}>
      {validation.errors.length > 0 && (
        <div className="validation-errors animate-slide-in">
          <div className="validation-header">
            <span className="validation-icon">❌</span>
            <h4>Issues to Fix ({validation.errors.length})</h4>
          </div>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-warnings animate-slide-in">
          <div className="validation-header">
            <span className="validation-icon">⚠️</span>
            <h4>Recommendations ({validation.warnings.length})</h4>
          </div>
          <ul>
            {validation.warnings.map((warning, index) => (
              <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div className="validation-suggestions animate-slide-in">
          <div className="validation-header">
            <span className="validation-icon">💡</span>
            <h4>Suggestions ({validation.suggestions.length})</h4>
          </div>
          <ul>
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && (
        <div className="validation-success animate-bounce-in">
          <div className="validation-header">
            <span className="validation-icon">✅</span>
            <h4>Your goal meets SMART criteria!</h4>
          </div>
          <p>Ready to create your goal and action plan.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="goal-form">
      <div className="form-header">
        <h2>Create a SMART Goal</h2>
        <p>Follow the SMART criteria to create a well-structured, achievable goal</p>

        {/* ADK Status Indicator */}
        {systemStatus && (
          <div className={`adk-status-indicator ${systemStatus.adkInitialized ? 'adk-active' : 'adk-inactive'}`}>
            <div className="status-icon">
              {systemStatus.adkInitialized ? '🤖' : '⚙️'}
            </div>
            <div className="status-text">
              <span className="status-label">
                {systemStatus.adkInitialized ? 'AI-Enhanced Analysis' : 'Basic Analysis'}
              </span>
              <span className="status-description">
                {systemStatus.adkInitialized
                  ? 'Advanced AI agents will help optimize your goal'
                  : 'Using traditional goal validation methods'
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time validation feedback */}
      {validation && (
        <ValidationFeedback validation={validation} />
      )}

      {isValidating && (
        <div className="validation-loading">
          <p>🔄 Validating your goal...</p>
        </div>
      )}

      {/* Form Progress Indicator */}
      <div className="form-progress">
        <div className="progress-header">
          <h4>Form Completion Progress</h4>
          <span className="progress-percentage">{getFormCompletionPercentage()}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getFormCompletionPercentage()}%` }}
          ></div>
        </div>
        <div className="progress-details">
          <span className="progress-text">
            {getCompletedFieldsCount()}/{getTotalRequiredFields()} required fields completed
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className={`form-group ${getFieldValidation('title').hasError ? 'has-error' : ''} ${isFieldRequired('title', formData.title) ? 'required-empty' : ''}`}>
            <label htmlFor="title">
              Goal Title <span className="required-indicator">*</span>
              {getFieldValidation('title').hasError && <span className="error-indicator animate-shake">⚠️</span>}
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="e.g., Learn Spanish"
              className={getFieldValidation('title').hasError ? 'error' : ''}
            />
            {getFieldValidation('title').messages.length > 0 && (
              <div className="field-validation-messages">
                {getFieldValidation('title').messages.map((message, index) => (
                  <span key={index} className="field-error animate-fade-in">{message}</span>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief overview of what you want to achieve"
              rows={3}
            />
          </div>
        </div>

        {/* Specific */}
        <div className="form-section">
          <h3>S - Specific</h3>
          <div className={`form-group ${getFieldValidation('specific').hasError ? 'has-error' : ''} ${isFieldRequired('specific', formData.specific) ? 'required-empty' : ''}`}>
            <label htmlFor="specific">
              What exactly do you want to accomplish? <span className="required-indicator">*</span>
              {getFieldValidation('specific').hasError && <span className="error-indicator animate-shake">⚠️</span>}
            </label>
            <textarea
              id="specific"
              value={formData.specific}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, specific: e.target.value }))}
              required
              placeholder="Be as detailed as possible about what you want to achieve (minimum 10 characters)"
              rows={3}
              className={getFieldValidation('specific').hasError ? 'error' : ''}
            />
            <div className="field-helper">
              <span className={`char-counter ${(formData.specific || '').length < 10 ? 'insufficient' : 'sufficient'}`}>
                {(formData.specific || '').length}/10 characters minimum
              </span>
            </div>
            {getFieldValidation('specific').messages.length > 0 && (
              <div className="field-validation-messages">
                {getFieldValidation('specific').messages.map((message, index) => (
                  <span key={index} className="field-error animate-fade-in">{message}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Measurable */}
        <div className="form-section">
          <h3>M - Measurable</h3>
          <div className={`form-group ${getFieldValidation('measurable').hasError ? 'has-error' : ''} ${isFieldRequired('measurable', formData.measurable) ? 'required-empty' : ''}`}>
            <label>
              How will you measure progress and success? <span className="required-indicator">*</span>
              {getFieldValidation('measurable').hasError && <span className="error-indicator animate-shake">⚠️</span>}
            </label>
            <p className="field-description">At least one metric is required to track your progress</p>

            {formData.measurable.map((metric, index) => {
              const hasMetricError = !metric.name || !metric.unit || metric.targetValue <= 0;
              return (
                <div key={index} className={`metric-group ${hasMetricError ? 'metric-error' : 'metric-valid'}`}>
                  <div className="metric-header">
                    <span className="metric-number">Metric {index + 1}</span>
                    {hasMetricError && <span className="metric-error-icon animate-pulse">⚠️</span>}
                    {!hasMetricError && <span className="metric-valid-icon">✅</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Metric Name <span className="required-indicator">*</span></label>
                      <input
                        type="text"
                        value={metric.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'name', e.target.value)}
                        placeholder="e.g., Vocabulary words learned"
                        className={!metric.name ? 'error' : ''}
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit <span className="required-indicator">*</span></label>
                      <input
                        type="text"
                        value={metric.unit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'unit', e.target.value)}
                        placeholder="e.g., words, hours, pages"
                        className={!metric.unit ? 'error' : ''}
                      />
                    </div>
                    <div className="form-group">
                      <label>Target Value <span className="required-indicator">*</span></label>
                      <input
                        type="number"
                        value={metric.targetValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'targetValue', Number(e.target.value))}
                        min="1"
                        className={metric.targetValue <= 0 ? 'error' : ''}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <button type="button" onClick={addMeasurableMetric} className="add-button">
              + Add Metric
            </button>

            {getFieldValidation('measurable').messages.length > 0 && (
              <div className="field-validation-messages">
                {getFieldValidation('measurable').messages.map((message, index) => (
                  <span key={index} className="field-error animate-fade-in">{message}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievable */}
        <div className="form-section">
          <h3>A - Achievable</h3>
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <select
              id="difficulty"
              value={formData.achievable.difficultyLevel}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({
                ...prev,
                achievable: { ...prev.achievable, difficultyLevel: e.target.value as any }
              }))}
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>

          <div className="form-group">
            <label>Required Resources</label>
            {formData.achievable.requiredResources.map((resource, index) => (
              <input
                key={index}
                type="text"
                value={resource}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateResource(index, e.target.value)}
                placeholder="e.g., Time, Money, Equipment"
              />
            ))}
            <button type="button" onClick={addResource} className="add-button">
              + Add Resource
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hours">Estimated Hours</label>
              <input
                type="number"
                id="hours"
                value={formData.achievable.estimatedEffort.hours}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  achievable: {
                    ...prev.achievable,
                    estimatedEffort: { ...prev.achievable.estimatedEffort, hours: Number(e.target.value) }
                  }
                }))}
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="weeks">Estimated Weeks</label>
              <input
                type="number"
                id="weeks"
                value={formData.achievable.estimatedEffort.weeks || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  achievable: {
                    ...prev.achievable,
                    estimatedEffort: { ...prev.achievable.estimatedEffort, weeks: Number(e.target.value) }
                  }
                }))}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Relevant */}
        <div className="form-section">
          <h3>R - Relevant</h3>
          <div className="form-group">
            <label>Personal Values</label>
            {formData.relevant.personalValues.map((value, index) => (
              <input
                key={index}
                type="text"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePersonalValue(index, e.target.value)}
                placeholder="e.g., Growth, Health, Career"
              />
            ))}
            <button type="button" onClick={addPersonalValue} className="add-button">
              + Add Value
            </button>
          </div>

          <div className="form-group">
            <label>Life Areas (select all that apply)</label>
            <div className="checkbox-grid">
              {Object.values(LifeDomain).map(domain => (
                <label key={domain} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.relevant.lifeAreas.includes(domain)}
                    onChange={() => toggleLifeArea(domain)}
                  />
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="motivation">Motivation</label>
            <textarea
              id="motivation"
              value={formData.relevant.motivation}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({
                ...prev,
                relevant: { ...prev.relevant, motivation: e.target.value }
              }))}
              placeholder="Why is this goal important to you?"
              rows={3}
            />
          </div>
        </div>

        {/* Time-bound */}
        <div className="form-section">
          <h3>T - Time-bound</h3>
          <div className="form-row">
            <div className={`form-group ${isFieldRequired('startDate', formData.timeBound.startDate) ? 'required-empty' : ''}`}>
              <label htmlFor="startDate">
                Start Date <span className="required-indicator">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.timeBound.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  timeBound: { ...prev.timeBound, startDate: e.target.value }
                }))}
                required
                className={isFieldRequired('startDate', formData.timeBound.startDate) ? 'error' : ''}
              />
            </div>
            <div className={`form-group ${isFieldRequired('endDate', formData.timeBound.endDate) ? 'required-empty' : ''} ${getFieldValidation('time-bound').hasError ? 'has-error' : ''}`}>
              <label htmlFor="endDate">
                End Date <span className="required-indicator">*</span>
                {getFieldValidation('time-bound').hasError && <span className="error-indicator animate-shake">⚠️</span>}
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.timeBound.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  timeBound: { ...prev.timeBound, endDate: e.target.value }
                }))}
                required
                className={isFieldRequired('endDate', formData.timeBound.endDate) || getFieldValidation('time-bound').hasError ? 'error' : ''}
              />
              {getFieldValidation('time-bound').messages.length > 0 && (
                <div className="field-validation-messages">
                  {getFieldValidation('time-bound').messages.map((message, index) => (
                    <span key={index} className="field-error animate-fade-in">{message}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Milestones (optional)</label>
            {formData.timeBound.milestones.map((milestone, index) => (
              <input
                key={index}
                type="date"
                value={milestone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMilestone(index, e.target.value)}
              />
            ))}
            <button type="button" onClick={addMilestone} className="add-button">
              + Add Milestone
            </button>
          </div>
        </div>

        <div className="form-actions">
          <div className="form-status">
            {validation && !validation.isValid && (
              <div className="form-status-message error animate-fade-in">
                <span className="status-icon">⚠️</span>
                Please fix {validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''} before creating your goal
              </div>
            )}
            {validation && validation.isValid && (
              <div className="form-status-message success animate-fade-in">
                <span className="status-icon">✅</span>
                Your goal is ready to be created!
              </div>
            )}
            {!validation && getFormCompletionPercentage() < 100 && (
              <div className="form-status-message incomplete animate-fade-in">
                <span className="status-icon">📝</span>
                Complete all required fields to validate your goal
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              className={`submit-button ${validation && validation.isValid ? 'ready' : 'disabled'}`}
              disabled={validation ? !validation.isValid : true}
            >
              {validation && validation.isValid ? (
                <>
                  <span className="button-icon">🚀</span>
                  Create Goal
                </>
              ) : (
                <>
                  <span className="button-icon">⏳</span>
                  {validation ? 'Fix Issues First' : 'Complete Form'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};