/**
 * Example component demonstrating ADK integration
 * This shows how to use the ADK Goal Planning Service in React components
 */
import React, { useState, useEffect } from 'react';
import { GoalService } from '../services/GoalService';
import { SMARTGoal } from '../types';

const ADKIntegrationExample: React.FC = () => {
    const [goalService] = useState(() => new GoalService());
    const [serviceStatus, setServiceStatus] = useState<{ available: boolean; message: string } | null>(null);
    const [userInput, setUserInput] = useState('');
    const [createdGoal, setCreatedGoal] = useState<SMARTGoal | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check ADK service status on component mount
        checkServiceStatus();
    }, []);

    const checkServiceStatus = async () => {
        try {
            const status = await goalService.getADKServiceStatus();
            setServiceStatus(status);
        } catch (err) {
            setServiceStatus({
                available: false,
                message: 'Failed to check ADK service status'
            });
        }
    };

    const handleCreateGoal = async () => {
        if (!userInput.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Create goal using ADK agents
            const goal = await goalService.createGoal(userInput);
            setCreatedGoal(goal);

            // Analyze the created goal
            const goalAnalysis = await goalService.analyzeGoal(goal.id);
            setAnalysis(goalAnalysis);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create goal');
        } finally {
            setLoading(false);
        }
    };

    const handleRefineGoal = async (feedback: string) => {
        if (!createdGoal || !feedback.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const refinedGoal = await goalService.refineGoal(createdGoal.id, feedback);
            setCreatedGoal(refinedGoal);

            // Re-analyze the refined goal
            const goalAnalysis = await goalService.analyzeGoal(refinedGoal.id);
            setAnalysis(goalAnalysis);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refine goal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>ADK Integration Example</h1>

            {/* Service Status */}
            <div style={{
                padding: '10px',
                marginBottom: '20px',
                backgroundColor: serviceStatus?.available ? '#d4edda' : '#f8d7da',
                border: `1px solid ${serviceStatus?.available ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px'
            }}>
                <strong>ADK Service Status:</strong> {serviceStatus?.message || 'Checking...'}
            </div>

            {/* Goal Input */}
            <div style={{ marginBottom: '20px' }}>
                <h3>Create Goal with ADK Agents</h3>
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your goal in natural language (e.g., 'I want to lose 20 pounds in 6 months by exercising regularly')"
                    style={{
                        width: '100%',
                        height: '100px',
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                <button
                    onClick={handleCreateGoal}
                    disabled={loading || !userInput.trim()}
                    style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Creating Goal...' : 'Create Goal with ADK'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    color: '#721c24'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Created Goal Display */}
            {createdGoal && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Created SMART Goal</h3>
                    <div style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <h4>{createdGoal.title}</h4>
                        <p><strong>Description:</strong> {createdGoal.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            <div>
                                <strong>Specific:</strong> {createdGoal.specific}
                            </div>
                            <div>
                                <strong>Measurable:</strong>
                                {Array.isArray(createdGoal.measurable) ?
                                    createdGoal.measurable.map((metric, i) => (
                                        <div key={i}>{metric.name}: {metric.currentValue}/{metric.targetValue} {metric.unit}</div>
                                    )) :
                                    String(createdGoal.measurable)
                                }
                            </div>
                            <div>
                                <strong>Achievable:</strong> {typeof createdGoal.achievable === 'object' ? JSON.stringify(createdGoal.achievable) : String(createdGoal.achievable)}
                            </div>
                            <div>
                                <strong>Relevant:</strong> {typeof createdGoal.relevant === 'object' ? JSON.stringify(createdGoal.relevant) : String(createdGoal.relevant)}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <strong>Time-bound:</strong> {typeof createdGoal.timeBound === 'object' ?
                                    `${createdGoal.timeBound.startDate.toLocaleDateString()} - ${createdGoal.timeBound.endDate.toLocaleDateString()}` :
                                    String(createdGoal.timeBound)
                                }
                            </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <strong>Status:</strong> {createdGoal.status} |
                            <strong> Created:</strong> {createdGoal.createdAt.toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Analysis Display */}
            {analysis && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>ADK Goal Analysis</h3>
                    <div style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#f0f8ff'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>Overall Score:</strong> {analysis.overallScore}/100
                            <div style={{
                                width: '100%',
                                height: '20px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '10px',
                                marginTop: '5px'
                            }}>
                                <div style={{
                                    width: `${analysis.overallScore}%`,
                                    height: '100%',
                                    backgroundColor: analysis.overallScore >= 70 ? '#28a745' : analysis.overallScore >= 50 ? '#ffc107' : '#dc3545',
                                    borderRadius: '10px'
                                }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            {Object.entries(analysis.smartAnalysis || {}).map(([criterion, data]: [string, any]) => (
                                <div key={criterion} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                    <strong>{criterion.charAt(0).toUpperCase() + criterion.slice(1)}:</strong> {data.score}/100
                                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                        {data.feedback}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div style={{ marginTop: '15px' }}>
                                <strong>Recommendations:</strong>
                                <ul style={{ marginTop: '5px' }}>
                                    {analysis.recommendations.map((rec: string, index: number) => (
                                        <li key={index} style={{ fontSize: '14px' }}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Goal Refinement */}
            {createdGoal && (
                <div>
                    <h3>Refine Goal with Feedback</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => handleRefineGoal('Make the timeline more specific with weekly milestones')}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Add Weekly Milestones
                        </button>
                        <button
                            onClick={() => handleRefineGoal('Make the measurable criteria more specific with exact numbers')}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Add Specific Metrics
                        </button>
                        <button
                            onClick={() => handleRefineGoal('Consider potential obstacles and how to overcome them')}
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#ffc107',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Address Obstacles
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ADKIntegrationExample;