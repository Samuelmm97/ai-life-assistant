import React, { useState, useEffect } from 'react';
import { CalendarView } from './CalendarView';
import { ScheduleEntryForm } from './ScheduleEntryForm';
import { CalendarIntegration } from './CalendarIntegration';
import { ScheduleEntry, SMARTGoal } from '../types';
import { CalendarService } from '../services/CalendarService';

interface CalendarProps {
    userId: string;
    goals: SMARTGoal[];
}

type CalendarMode = 'view' | 'create' | 'edit' | 'import';

export const Calendar: React.FC<CalendarProps> = ({ userId, goals }) => {
    const [mode, setMode] = useState<CalendarMode>('view');
    const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
    const [createDate, setCreateDate] = useState<Date | null>(null);
    const [createHour, setCreateHour] = useState<number | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [calendarService] = useState(() => new CalendarService());

    const handleCreateEntry = (date: Date, hour: number) => {
        setCreateDate(date);
        setCreateHour(hour);
        setMode('create');
    };

    const handleEntryClick = (entry: ScheduleEntry) => {
        setSelectedEntry(entry);
        setMode('edit');
    };

    const handleFormSubmit = async (entryData: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (mode === 'create') {
                await calendarService.createScheduleEntry(entryData);
            } else if (mode === 'edit' && selectedEntry) {
                await calendarService.updateScheduleEntry(selectedEntry.id, entryData);
            }

            setMode('view');
            setSelectedEntry(null);
            setCreateDate(null);
            setCreateHour(null);
            setRefreshKey(prev => prev + 1); // Trigger calendar refresh
        } catch (error) {
            console.error('Error saving schedule entry:', error);
            alert('Failed to save schedule entry. Please try again.');
        }
    };

    const handleFormCancel = () => {
        setMode('view');
        setSelectedEntry(null);
        setCreateDate(null);
        setCreateHour(null);
    };

    const handleImportComplete = (importedEntries: ScheduleEntry[]) => {
        setMode('view');
        setRefreshKey(prev => prev + 1); // Trigger calendar refresh

        // Show a brief notification
        if (importedEntries.length > 0) {
            // You could add a toast notification here in a real app
            console.log(`Successfully imported ${importedEntries.length} calendar entries`);
        }
    };

    const handleDeleteEntry = async () => {
        if (selectedEntry && window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await calendarService.deleteScheduleEntry(selectedEntry.id);
                setMode('view');
                setSelectedEntry(null);
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert('Failed to delete entry. Please try again.');
            }
        }
    };

    const renderCurrentMode = () => {
        switch (mode) {
            case 'create':
                return (
                    <ScheduleEntryForm
                        userId={userId}
                        goals={goals}
                        initialDate={createDate || undefined}
                        initialHour={createHour || undefined}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                    />
                );

            case 'edit':
                return selectedEntry ? (
                    <div className="edit-entry-container">
                        <ScheduleEntryForm
                            userId={userId}
                            goals={goals}
                            initialEntry={selectedEntry}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                        />
                        <div className="entry-actions">
                            <button
                                className="delete-entry-button"
                                onClick={handleDeleteEntry}
                            >
                                🗑️ Delete Entry
                            </button>
                        </div>
                    </div>
                ) : null;

            case 'import':
                return (
                    <CalendarIntegration
                        userId={userId}
                        onImportComplete={handleImportComplete}
                    />
                );

            case 'view':
            default:
                return (
                    <CalendarView
                        key={refreshKey}
                        userId={userId}
                        onEntryClick={handleEntryClick}
                        onCreateEntry={handleCreateEntry}
                    />
                );
        }
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>📅 Calendar</h2>
                <div className="calendar-actions">
                    <button
                        className={`action-button ${mode === 'view' ? 'active' : ''}`}
                        onClick={() => setMode('view')}
                    >
                        📊 View Calendar
                    </button>
                    <button
                        className={`action-button ${mode === 'import' ? 'active' : ''}`}
                        onClick={() => setMode('import')}
                    >
                        📥 Import Calendar
                    </button>
                </div>
            </div>

            <div className="calendar-content">
                {renderCurrentMode()}
            </div>
        </div>
    );
};