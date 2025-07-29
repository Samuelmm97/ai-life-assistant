import React, { useState, useEffect } from 'react';
import { ScheduleEntry, CalendarConflict } from '../types';
import { CalendarService } from '../services/CalendarService';

interface CalendarViewProps {
    userId: string;
    onEntryClick?: (entry: ScheduleEntry) => void;
    onCreateEntry?: (date: Date, hour: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    userId,
    onEntryClick,
    onCreateEntry
}) => {
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [calendarService] = useState(() => new CalendarService());

    useEffect(() => {
        loadCalendarData();
    }, [userId, currentWeek]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            const weekStart = getWeekStart(currentWeek);
            const weekEnd = getWeekEnd(currentWeek);

            const [weekEntries, weekConflicts] = await Promise.all([
                calendarService.getScheduleEntries(userId, weekStart, weekEnd),
                calendarService.detectConflicts(userId, { start: weekStart, end: weekEnd })
            ]);

            setEntries(weekEntries);
            setConflicts(weekConflicts);
        } catch (error) {
            console.error('Error loading calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeekStart = (date: Date): Date => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day; // Sunday = 0
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    };

    const getWeekEnd = (date: Date): Date => {
        const end = new Date(date);
        const day = end.getDay();
        const diff = end.getDate() + (6 - day); // Saturday
        end.setDate(diff);
        end.setHours(23, 59, 59, 999);
        return end;
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeek(newWeek);
    };

    const getWeekDays = (): Date[] => {
        const weekStart = getWeekStart(currentWeek);
        const days: Date[] = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }

        return days;
    };

    const getEntriesForDay = (date: Date): ScheduleEntry[] => {
        return entries.filter(entry => {
            const entryDate = new Date(entry.startTime);
            return entryDate.toDateString() === date.toDateString();
        });
    };

    const getEntryStyle = (entry: ScheduleEntry): React.CSSProperties => {
        const startHour = entry.startTime.getHours();
        const startMinute = entry.startTime.getMinutes();
        const endHour = entry.endTime.getHours();
        const endMinute = entry.endTime.getMinutes();

        const top = (startHour * 60 + startMinute) / 60 * 60; // 60px per hour
        const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60 * 60;

        const isConflicted = conflicts.some(conflict =>
            conflict.conflictingEntries.some(e => e.id === entry.id)
        );

        return {
            position: 'absolute',
            top: `${top}px`,
            height: `${height}px`,
            left: '4px',
            right: '4px',
            backgroundColor: isConflicted ? '#fef2f2' : entry.goalId ? '#f0f9ff' : '#f8fafc',
            border: isConflicted ? '2px solid #ef4444' : entry.goalId ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 1
        };
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const weekDays = getWeekDays();

    if (loading) {
        return (
            <div className="calendar-loading">
                <div className="loading-spinner">📅</div>
                <p>Loading calendar...</p>
            </div>
        );
    }

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <div className="calendar-navigation">
                    <button
                        className="nav-button"
                        onClick={() => navigateWeek('prev')}
                    >
                        ← Previous Week
                    </button>

                    <h3 className="current-week">
                        {getWeekStart(currentWeek).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric'
                        })} - {getWeekEnd(currentWeek).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </h3>

                    <button
                        className="nav-button"
                        onClick={() => navigateWeek('next')}
                    >
                        Next Week →
                    </button>
                </div>

                {conflicts.length > 0 && (
                    <div className="conflicts-alert">
                        <span className="conflict-icon">⚠️</span>
                        {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
                    </div>
                )}
            </div>

            <div className="calendar-grid">
                <div className="time-column">
                    <div className="time-header"></div>
                    {hours.map(hour => (
                        <div key={hour} className="time-slot">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                    ))}
                </div>

                {weekDays.map((day, dayIndex) => (
                    <div key={day.toISOString()} className="day-column">
                        <div className="day-header">
                            <div className="day-name">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="day-date">
                                {day.getDate()}
                            </div>
                        </div>

                        <div className="day-content">
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    className="hour-slot"
                                    onClick={() => onCreateEntry && onCreateEntry(day, hour)}
                                    title="Click to create new entry"
                                >
                                    {hour % 2 === 0 && (
                                        <div className="hour-line"></div>
                                    )}
                                </div>
                            ))}

                            {getEntriesForDay(day).map(entry => (
                                <div
                                    key={entry.id}
                                    className="calendar-entry"
                                    style={getEntryStyle(entry)}
                                    onClick={() => onEntryClick && onEntryClick(entry)}
                                    title={`${entry.title}\n${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`}
                                >
                                    <div className="entry-title">{entry.title}</div>
                                    <div className="entry-time">
                                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                    </div>
                                    {entry.goalId && (
                                        <div className="entry-goal-indicator">🎯</div>
                                    )}
                                    {entry.isImported && (
                                        <div className="entry-imported-indicator">📥</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {conflicts.length > 0 && (
                <div className="conflicts-panel">
                    <h4>Scheduling Conflicts</h4>
                    {conflicts.map(conflict => (
                        <div key={conflict.id} className={`conflict-item severity-${conflict.severity}`}>
                            <div className="conflict-header">
                                <span className="conflict-type">{conflict.type}</span>
                                <span className="conflict-severity">{conflict.severity} priority</span>
                            </div>
                            <div className="conflict-entries">
                                {conflict.conflictingEntries.map(entry => entry.title).join(' ↔ ')}
                            </div>
                            <div className="conflict-suggestions">
                                <strong>Suggestions:</strong>
                                <ul>
                                    {conflict.suggestions.map((suggestion, index) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};