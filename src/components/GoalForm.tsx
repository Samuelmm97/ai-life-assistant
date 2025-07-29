import React, { useState } from 'react';
import { GoalStatus, LifeDomain, MeasurableMetric, AchievabilityAssessment, RelevanceContext, TimeConstraint, SMARTGoal } from '../types';

interface GoalFormProps {
  onSubmit: (goal: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onCancel }) => {
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

  return (
    <div className="goal-form">
      <div className="form-header">
        <h2>Create a SMART Goal</h2>
        <p>Follow the SMART criteria to create a well-structured, achievable goal</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="title">Goal Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="e.g., Learn Spanish"
            />
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
          <div className="form-group">
            <label htmlFor="specific">What exactly do you want to accomplish? *</label>
            <textarea
              id="specific"
              value={formData.specific}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, specific: e.target.value }))}
              required
              placeholder="Be as detailed as possible about what you want to achieve"
              rows={3}
            />
          </div>
        </div>

        {/* Measurable */}
        <div className="form-section">
          <h3>M - Measurable</h3>
          <p>How will you measure progress and success?</p>
          {formData.measurable.map((metric, index) => (
            <div key={index} className="metric-group">
              <div className="form-row">
                <div className="form-group">
                  <label>Metric Name</label>
                  <input
                    type="text"
                    value={metric.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'name', e.target.value)}
                    placeholder="e.g., Vocabulary words learned"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={metric.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'unit', e.target.value)}
                    placeholder="e.g., words, hours, pages"
                  />
                </div>
                <div className="form-group">
                  <label>Target Value</label>
                  <input
                    type="number"
                    value={metric.targetValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMeasurableMetric(index, 'targetValue', Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addMeasurableMetric} className="add-button">
            + Add Metric
          </button>
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
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                value={formData.timeBound.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  timeBound: { ...prev.timeBound, startDate: e.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End Date *</label>
              <input
                type="date"
                id="endDate"
                value={formData.timeBound.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  timeBound: { ...prev.timeBound, endDate: e.target.value }
                }))}
                required
              />
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
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="submit-button">
            Create Goal
          </button>
        </div>
      </form>
    </div>
  );
};