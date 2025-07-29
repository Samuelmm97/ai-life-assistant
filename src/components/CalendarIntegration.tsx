import React, { useState } from 'react';
import { ScheduleEntry } from '../types';
import { CalendarService } from '../services/CalendarService';

interface CalendarIntegrationProps {
    userId: string;
    onImportComplete: (entries: ScheduleEntry[]) => void;
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
    userId,
    onImportComplete
}) => {
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string>('');
    const [importedEntries, setImportedEntries] = useState<ScheduleEntry[]>([]);
    const [showDetails, setShowDetails] = useState(false);
    const [calendarService] = useState(() => new CalendarService());

    const handleGoogleCalendarImport = async () => {
        try {
            setImporting(true);
            setImportStatus('🔄 Connecting to Google Calendar...');
            setImportedEntries([]);
            setShowDetails(false);

            // Simulate connection delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            setImportStatus('📥 Importing events from your calendar...');

            // Mock Google Calendar import for MVP
            // In real implementation, this would use Google Calendar API
            const mockAccessToken = 'mock-token';

            // Simulate import delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const importedEvents = await calendarService.importFromGoogleCalendar(userId, mockAccessToken);

            setImportedEntries(importedEvents);
            setImportStatus(`✅ Successfully imported ${importedEvents.length} events from Google Calendar!`);
            setShowDetails(true);

            onImportComplete(importedEvents);

            // Keep success message visible longer
            setTimeout(() => {
                setImportStatus('');
                setShowDetails(false);
            }, 10000);

        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('❌ Import failed. Please try again.');
            setTimeout(() => {
                setImportStatus('');
            }, 5000);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="calendar-integration">
            <h4>Calendar Import</h4>
            <p>Import your existing calendar events to avoid scheduling conflicts.</p>

            <div className="integration-options">
                <div className="integration-option">
                    <div className="option-info">
                        <h5>📅 Google Calendar</h5>
                        <p>Import events from your Google Calendar</p>
                    </div>
                    <button
                        className="import-button"
                        onClick={handleGoogleCalendarImport}
                        disabled={importing}
                    >
                        {importing ? 'Importing...' : 'Import from Google'}
                    </button>
                </div>

                <div className="integration-option disabled">
                    <div className="option-info">
                        <h5>📅 Outlook Calendar</h5>
                        <p>Coming soon</p>
                    </div>
                    <button className="import-button" disabled>
                        Coming Soon
                    </button>
                </div>
            </div>

            {importStatus && (
                <div className={`import-status ${importing ? 'loading' : importStatus.includes('✅') ? 'success' : 'error'}`}>
                    {importing && <span className="loading-spinner">⏳</span>}
                    {importStatus}
                </div>
            )}

            {showDetails && importedEntries.length > 0 && (
                <div className="import-details">
                    <h5>📋 Imported Events:</h5>
                    <div className="imported-entries-list">
                        {importedEntries.map((entry, index) => (
                            <div key={entry.id} className="imported-entry">
                                <div className="entry-info">
                                    <strong>{entry.title}</strong>
                                    <span className="entry-time">
                                        {entry.startTime.toLocaleDateString()} at {entry.startTime.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                    {entry.description && (
                                        <span className="entry-description">{entry.description}</span>
                                    )}
                                </div>
                                <div className="entry-badges">
                                    <span className="source-badge">Google</span>
                                    <span className={`priority-badge ${entry.priority}`}>{entry.priority}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="import-summary">
                        <p>
                            <strong>Next steps:</strong> These events are now in your calendar and will be considered
                            when scheduling new goal-related activities to avoid conflicts.
                        </p>
                        <button
                            className="view-calendar-button"
                            onClick={() => window.location.hash = '#calendar'}
                        >
                            📅 View Calendar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};