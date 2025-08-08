/**
 * ADK Test Component
 * Simple component to test Python ADK service connection
 */
import React, { useState, useEffect } from 'react';
import { getPythonADKService } from '../services/PythonADKService';

export const ADKTestComponent: React.FC = () => {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [agentsInfo, setAgentsInfo] = useState<any>(null);
    const [testInput, setTestInput] = useState('I want to lose 10 pounds in 3 months');
    const [testResult, setTestResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const adkService = getPythonADKService();

    useEffect(() => {
        checkServiceHealth();
        getAgentsInfo();
    }, []);

    const checkServiceHealth = async () => {
        try {
            const healthy = await adkService.checkHealth();
            setIsHealthy(healthy);
        } catch (error) {
            setIsHealthy(false);
            setError(error instanceof Error ? error.message : 'Health check failed');
        }
    };

    const getAgentsInfo = async () => {
        try {
            const info = await adkService.getAgentsInfo();
            setAgentsInfo(info);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to get agents info');
        }
    };

    const testGoalPlanning = async () => {
        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            const result = await adkService.planGoal(testInput);
            setTestResult(result);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Goal planning test failed');
        } finally {
            setLoading(false);
        }
    };

    const testSMARTCriteria = async () => {
        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            const result = await adkService.generateSMARTCriteria(testInput);
            setTestResult(result);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'SMART criteria test failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Python ADK Service Test</h2>

            {/* Service Health */}
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Service Health</h3>
                <p>Status: <span style={{ color: isHealthy ? 'green' : 'red' }}>
                    {isHealthy === null ? 'Checking...' : isHealthy ? 'Healthy' : 'Unavailable'}
                </span></p>
                <button onClick={checkServiceHealth}>Refresh Health Check</button>
            </div>

            {/* Agents Info */}
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Available Agents</h3>
                {agentsInfo ? (
                    <div>
                        {agentsInfo.success ? (
                            <div>
                                <p>Total Agents: {agentsInfo.total_agents}</p>
                                <ul>
                                    {Object.entries(agentsInfo.agents || {}).map(([key, agent]: [string, any]) => (
                                        <li key={key}>
                                            <strong>{agent.name}</strong>: {agent.description}
                                            <span style={{ color: agent.status === 'active' ? 'green' : 'orange' }}>
                                                ({agent.status})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p style={{ color: 'red' }}>Error: {agentsInfo.error}</p>
                        )}
                    </div>
                ) : (
                    <p>Loading agents info...</p>
                )}
                <button onClick={getAgentsInfo}>Refresh Agents Info</button>
            </div>

            {/* Test Input */}
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h3>Test Goal Planning</h3>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        Test Input:
                        <textarea
                            value={testInput}
                            onChange={(e) => setTestInput(e.target.value)}
                            style={{ width: '100%', height: '60px', marginTop: '5px' }}
                            placeholder="Enter a goal description to test..."
                        />
                    </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <button
                        onClick={testGoalPlanning}
                        disabled={loading || !isHealthy}
                        style={{ marginRight: '10px' }}
                    >
                        {loading ? 'Testing...' : 'Test Goal Planning'}
                    </button>
                    <button
                        onClick={testSMARTCriteria}
                        disabled={loading || !isHealthy}
                    >
                        {loading ? 'Testing...' : 'Test SMART Criteria'}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '5px' }}>
                    <h4 style={{ color: '#f44336', margin: '0 0 10px 0' }}>Error</h4>
                    <p style={{ margin: 0, color: '#f44336' }}>{error}</p>
                </div>
            )}

            {/* Test Results */}
            {testResult && (
                <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <h3>Test Results</h3>
                    <pre style={{
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        borderRadius: '3px',
                        overflow: 'auto',
                        fontSize: '12px'
                    }}>
                        {JSON.stringify(testResult, null, 2)}
                    </pre>
                </div>
            )}

            {/* Instructions */}
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '5px' }}>
                <h4 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>Instructions</h4>
                <ol style={{ margin: 0, color: '#1976d2' }}>
                    <li>Make sure your Python ADK service is running on localhost:5000</li>
                    <li>Start it with: <code>cd python-agents && python app.py</code></li>
                    <li>Check that the service health shows "Healthy"</li>
                    <li>Test goal planning with the sample input or your own</li>
                </ol>
            </div>
        </div>
    );
};

export default ADKTestComponent;