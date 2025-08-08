/**
 * ADK Goal Planning Service
 * Connects to Python Flask API with ADK agents for intelligent goal planning
 */
import { SMARTGoal, GoalStatus, LifeDomain } from '../types';

// Python API Response Types (matching your Flask app)
interface PythonAPIResponse {
    success: boolean;
    error?: string;
    agent?: string;
    [key: string]: any;
}

interface AgentInfo {
    name: string;
    description: string;
    status: string;
    capabilities: string[];
}

interface AgentsInfoResponse {
    success: boolean;
    agents: {
        master_orchestrator: AgentInfo;
        goal_planning: AgentInfo;
        goal_analysis: AgentInfo;
        smart_criteria: AgentInfo;
    };
    total_agents: number;
}

interface GoalAnalysis {
    overallScore: number;
    smartAnalysis: {
        specific: { score: number; feedback: string; suggestions: string[] };
        measurable: { score: number; feedback: string; suggestions: string[] };
        achievable: { score: number; feedback: string; suggestions: string[] };
        relevant: { score: number; feedback: string; suggestions: string[] };
        timeBound: { score: number; feedback: string; suggestions: string[] };
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskFactors: string[];
    successProbability: number;
}

export class ADKGoalPlanningService {
    private baseUrl: string;
    private timeout: number;
    private isServiceAvailable: boolean = false;

    constructor(baseUrl: string = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Check if Python ADK service is available
     */
    async checkServiceHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000) // 5 second timeout for health check
            });

            if (response.ok) {
                const data = await response.json();
                this.isServiceAvailable = data.status === 'healthy';
                return this.isServiceAvailable;
            }

            this.isServiceAvailable = false;
            return false;
        } catch (error) {
            console.warn('ADK service health check failed:', error);
            this.isServiceAvailable = false;
            return false;
        }
    }

    /**
     * Get information about available ADK agents
     */
    async getAgentsInfo(): Promise<AgentsInfoResponse | null> {
        try {
            const response = await this.makeRequest('/api/agents/info', 'GET');
            return response as AgentsInfoResponse;
        } catch (error) {
            console.error('Failed to get agents info:', error);
            return null;
        }
    }

    /**
     * Plan a SMART goal from natural language input using Python ADK agents
     */
    async planGoalFromText(userInput: string): Promise<SMARTGoal> {
        try {
            // Check service availability first
            const isHealthy = await this.checkServiceHealth();
            if (!isHealthy) {
                console.warn('ADK service not available, using fallback');
                return this.createFallbackGoal(userInput);
            }

            // Call Python API to plan goal
            const response = await this.makeRequest('/api/plan-goal', 'POST', {
                input: userInput
            });

            if (response.success && response.goal) {
                return this.convertPythonResponseToSMARTGoal(response.goal, userInput);
            } else {
                console.warn('ADK goal planning failed:', response.error);
                return this.createFallbackGoal(userInput);
            }
        } catch (error) {
            console.warn('ADK goal planning failed, using fallback:', error);
            return this.createFallbackGoal(userInput);
        }
    }

    /**
     * Analyze an existing goal for SMART criteria compliance using Python ADK agents
     */
    async analyzeGoal(goal: SMARTGoal): Promise<GoalAnalysis> {
        try {
            // Check service availability first
            const isHealthy = await this.checkServiceHealth();
            if (!isHealthy) {
                console.warn('ADK service not available for analysis');
                return this.createFallbackAnalysis();
            }

            const response = await this.makeRequest('/api/analyze-goal', 'POST', { goal });

            if (response.success && response.analysis) {
                return response.analysis;
            } else {
                console.warn('ADK goal analysis failed:', response.error);
                return this.createFallbackAnalysis();
            }
        } catch (error) {
            console.warn('ADK service unavailable for analysis:', error);
            return this.createFallbackAnalysis();
        }
    }

    /**
     * Generate SMART criteria suggestions using Python ADK agents
     */
    async generateSMARTCriteria(title: string, description: string): Promise<any> {
        try {
            const isHealthy = await this.checkServiceHealth();
            if (!isHealthy) {
                return this.createFallbackSMARTCriteria(title);
            }

            const response = await this.makeRequest('/api/generate-smart-criteria', 'POST', {
                title,
                description
            });

            if (response.success && response.criteria) {
                return response.criteria;
            } else {
                return this.createFallbackSMARTCriteria(title);
            }
        } catch (error) {
            console.warn('SMART criteria generation failed:', error);
            return this.createFallbackSMARTCriteria(title);
        }
    }

    /**
     * Refine a goal based on feedback using Python ADK agents
     */
    async refineGoal(goal: SMARTGoal, feedback: string, maxIterations: number = 3): Promise<SMARTGoal> {
        try {
            const isHealthy = await this.checkServiceHealth();
            if (!isHealthy) {
                console.warn('ADK service not available for refinement');
                return goal; // Return original goal if service unavailable
            }

            const response = await this.makeRequest('/api/refine-goal', 'POST', {
                goal,
                feedback,
                max_iterations: maxIterations
            });

            if (response.success && response.refined_goal) {
                return this.convertPythonResponseToSMARTGoal(response.refined_goal, goal.description);
            } else {
                console.warn('Goal refinement failed:', response.error);
                return goal;
            }
        } catch (error) {
            console.warn('Goal refinement failed:', error);
            return goal;
        }
    }

    /**
     * Check if ADK service is available
     */
    isAvailable(): boolean {
        return this.isServiceAvailable;
    }

    /**
     * Make HTTP request to Python Flask API
     */
    private async makeRequest(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        data?: any
    ): Promise<PythonAPIResponse> {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const requestOptions: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.timeout),
            };

            if (data && method === 'POST') {
                requestOptions.body = JSON.stringify(data);
            }

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result as PythonAPIResponse;

        } catch (error) {
            console.error(`ADK API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Convert Python API response to SMARTGoal format
     */
    private convertPythonResponseToSMARTGoal(pythonGoal: any, originalInput: string): SMARTGoal {
        return {
            id: pythonGoal.id || this.generateId(),
            userId: pythonGoal.userId || 'default-user',
            title: pythonGoal.title || this.extractTitleFromInput(originalInput),
            description: pythonGoal.description || originalInput,
            specific: pythonGoal.specific || pythonGoal.smartCriteria?.specific || 'Generated by ADK agents',
            measurable: pythonGoal.measurable || [{
                name: 'Progress',
                unit: 'percent',
                targetValue: 100,
                currentValue: 0
            }],
            achievable: pythonGoal.achievable || {
                difficultyLevel: 'moderate' as const,
                requiredResources: ['Time', 'Effort'],
                estimatedEffort: { hours: 20 }
            },
            relevant: pythonGoal.relevant || {
                personalValues: ['Growth', 'Achievement'],
                lifeAreas: [LifeDomain.PERSONAL],
                motivation: 'AI-generated goal based on user input'
            },
            timeBound: pythonGoal.timeBound || {
                startDate: new Date(),
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                milestones: []
            },
            status: (pythonGoal.status as GoalStatus) || GoalStatus.ACTIVE,
            createdAt: pythonGoal.createdAt ? new Date(pythonGoal.createdAt) : new Date(),
            updatedAt: pythonGoal.updatedAt ? new Date(pythonGoal.updatedAt) : new Date()
        };
    }

    private extractTitleFromInput(input: string): string {
        // Extract a reasonable title from the input (first 50 characters)
        return input.length > 50 ? input.substring(0, 50).trim() + '...' : input.trim();
    }

    private createFallbackGoal(userInput: string): SMARTGoal {
        return {
            id: this.generateId(),
            userId: 'default-user',
            title: this.extractTitleFromInput(userInput),
            description: userInput,
            specific: 'Needs refinement - ADK service unavailable. Please refine this goal manually.',
            measurable: [{
                name: 'Progress',
                unit: 'percent',
                targetValue: 100,
                currentValue: 0
            }],
            achievable: {
                difficultyLevel: 'moderate' as const,
                requiredResources: ['Time', 'Effort'],
                estimatedEffort: { hours: 10 }
            },
            relevant: {
                personalValues: ['Growth', 'Achievement'],
                lifeAreas: [LifeDomain.PERSONAL],
                motivation: 'Personal development goal'
            },
            timeBound: {
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                milestones: []
            },
            status: GoalStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    private createFallbackAnalysis(): GoalAnalysis {
        return {
            overallScore: 50,
            smartAnalysis: {
                specific: { score: 50, feedback: 'Analysis unavailable - ADK service not responding', suggestions: ['Manual review needed'] },
                measurable: { score: 50, feedback: 'Analysis unavailable - ADK service not responding', suggestions: ['Manual review needed'] },
                achievable: { score: 50, feedback: 'Analysis unavailable - ADK service not responding', suggestions: ['Manual review needed'] },
                relevant: { score: 50, feedback: 'Analysis unavailable - ADK service not responding', suggestions: ['Manual review needed'] },
                timeBound: { score: 50, feedback: 'Analysis unavailable - ADK service not responding', suggestions: ['Manual review needed'] }
            },
            strengths: [],
            weaknesses: ['ADK analysis service unavailable'],
            recommendations: ['Retry when Python ADK service is available', 'Check if Python agents are running on localhost:5000'],
            riskFactors: ['Unable to perform intelligent analysis'],
            successProbability: 50
        };
    }

    private createFallbackSMARTCriteria(title: string): any {
        return {
            specific: { suggestions: [`Define exactly what you want to achieve with "${title}"`] },
            measurable: { suggestions: [`Identify how you will measure progress on "${title}"`] },
            achievable: { suggestions: [`Ensure "${title}" is realistic given your resources`] },
            relevant: { suggestions: [`Confirm "${title}" aligns with your priorities`] },
            timeBound: { suggestions: [`Set a clear deadline for "${title}"`] }
        };
    }

    private generateId(): string {
        return 'goal_' + Math.random().toString(36).substr(2, 9);
    }
}