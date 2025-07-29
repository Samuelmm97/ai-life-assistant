import React, { useState, useEffect } from 'react';
import { ScheduleEntry, Priority, FlexibilityLevel, LifeDomain, SMARTGoal } from '../types';

interface ScheduleEntryFormProps {
    userId: string;
    goals: SMARTGoal[];
    initialEntry?: Partial<ScheduleEntry>;
    initialDate?: Date;
    initialHour?: number;
    onSubmit: (entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
}

export const ScheduleEntryForm: React.FC<ScheduleEntryFormProps> = ({
    userId,
    goals,
    initialEntry,
    initialDate,
    initialHour,
    onSubmit,
    onCancel
}) => {
    const [formData, setFormData] = useState({
        title: initialEntry?.title || '',
        description: initialEntry?.description || '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        priority: initialEntry?.priority || Priority.MEDIUM,
        flexibility: initialEntry?.flexibility || FlexibilityLevel.FLEXIBLE,
        domain: initialEntry?.domain || '',
        goalId: initialEntry?.goalId || '',
        isImported: initialEntry?.isImported || false
    });

    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (initialDate) {
            const dateStr = initialDate.toISOString().split('T')[0];
            const hour = initialHour || 9;
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

            setFormData(prev => ({
                ...prev,
                startDate: dateStr,
                endDate: dateStr,
                startTime,
                endTime
            }));
        }
    }, [initialDate, initialHour]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear errors when user starts typing
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        if (!formData.title.trim()) {
            newErrors.push('Title is required');
        }

        if (!formData.startDate) {
            newErrors.push('Start date is required');
        }

        if (!formData.startTime) {
            newErrors.push('Start time is required');
        }

        if (!formData.endDate) {
            newErrors.push('End date is required');
        }

        if (!formData.endTime) {
            newErrors.push('End time is required');
        }

        if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

            if (startDateTime >= endDateTime) {
                newErrors.push('End time must be after start time');
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        const entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> = {
            userId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            startTime: startDateTime,
            endTime: endDateTime,
            priority: formData.priority as Priority,
            flexibility: formData.flexibility as FlexibilityLevel,
            domain: formData.domain ? formData.domain as LifeDomain : undefined,
            goalId: formData.goalId || undefined,
            dependencies: [],
            isImported: formData.isImported
        };

        onSubmit(entry);
    };

    const getGoalTitle = (goalId: string): string => {
        const goal = goals.find(g => g.id === goalId);
        return goal ? goal.title : '';
    };

    return (
        <div className="schedule-entry-form">
            <div className="form-header">
                <h3>{initialEntry ? 'Edit Schedule Entry' : 'Create Schedule Entry'}</h3>
                <button className="close-button" onClick={onCancel}>×</button>
            </div>

            {errors.length > 0 && (
                <div className="form-errors">
                    <h4>Please fix the following errors:</h4>
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="entry-form">
                <div className="form-section">
                    <div className="form-group">
                        <label htmlFor="title">
                            Title <span className="required">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter event title"
                            className={errors.some(e => e.includes('Title')) ? 'error' : ''}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h4>Date & Time</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">
                                Start Date <span className="required">*</span>
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className={errors.some(e => e.includes('Start date')) ? 'error' : ''}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="startTime">
                                Start Time <span className="required">*</span>
                            </label>
                            <input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleInputChange('startTime', e.target.value)}
                                className={errors.some(e => e.includes('Start time')) ? 'error' : ''}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="endDate">
                                End Date <span className="required">*</span>
                            </label>
                            <input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className={errors.some(e => e.includes('End date')) ? 'error' : ''}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endTime">
                                End Time <span className="required">*</span>
                            </label>
                            <input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleInputChange('endTime', e.target.value)}
                                className={errors.some(e => e.includes('End time')) ? 'error' : ''}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h4>Settings</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                value={formData.priority}
                                onChange={(e) => handleInputChange('priority', e.target.value)}
                            >
                                <option value={Priority.LOW}>Low</option>
                                <option value={Priority.MEDIUM}>Medium</option>
                                <option value={Priority.HIGH}>High</option>
                                <option value={Priority.CRITICAL}>Critical</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="flexibility">Flexibility</label>
                            <select
                                id="flexibility"
                                value={formData.flexibility}
                                onChange={(e) => handleInputChange('flexibility', e.target.value)}
                            >
                                <option value={FlexibilityLevel.FIXED}>Fixed (Cannot be moved)</option>
                                <option value={FlexibilityLevel.FLEXIBLE}>Flexible</option>
                                <option value={FlexibilityLevel.VERY_FLEXIBLE}>Very Flexible</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="domain">Life Domain</label>
                            <select
                                id="domain"
                                value={formData.domain}
                                onChange={(e) => handleInputChange('domain', e.target.value)}
                            >
                                <option value="">None</option>
                                <option value={LifeDomain.FITNESS}>Fitness</option>
                                <option value={LifeDomain.NUTRITION}>Nutrition</option>
                                <option value={LifeDomain.LEARNING}>Learning</option>
                                <option value={LifeDomain.HEALTH}>Health</option>
                                <option value={LifeDomain.SLEEP}>Sleep</option>
                                <option value={LifeDomain.HABITS}>Habits</option>
                                <option value={LifeDomain.CAREER}>Career</option>
                                <option value={LifeDomain.SOCIAL}>Social</option>
                                <option value={LifeDomain.PROJECTS}>Projects</option>
                                <option value={LifeDomain.FINANCE}>Finance</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="goalId">Related Goal</label>
                            <select
                                id="goalId"
                                value={formData.goalId}
                                onChange={(e) => handleInputChange('goalId', e.target.value)}
                            >
                                <option value="">None</option>
                                {goals.map(goal => (
                                    <option key={goal.id} value={goal.id}>
                                        {goal.title}
                                    </option>
                                ))}
                            </select>
                            {formData.goalId && (
                                <div className="field-helper">
                                    <span className="goal-preview">🎯 {getGoalTitle(formData.goalId)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="submit-button">
                        {initialEntry ? 'Update Entry' : 'Create Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};