/**
 * Python ADK Service
 * Simple service to connect to Python Flask API with ADK agents
 */

export interface PythonADKResponse {
    success: boolean;
    error?: string;
    agent?: string;
    [key: string]: any;
}

export interface AgentInfo {
    name: string;
    description: string;
    status: string;
    capabilities: string[];
}

export class PythonADKService {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Check if Python ADK service is healthy
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                return data.status === 'healthy';
            }
            return false;
        } catch (error) {
            console.warn('Python ADK service health check failed:', error);
            return false;
        }
    }

    /**
     * Get information about available agents
     */
    async getAgentsInfo(): Promise<any> {
        try {
            const response = await this.makeRequest('/api/agents/info', 'GET');
            return response;
        } catch (error) {
            console.error('Failed to get agents info:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Plan a goal using ADK agents
     */
    async planGoal(userInput: string): Promise<PythonADKResponse> {
        try {
            const response = await this.makeRequest('/api/plan-goal', 'POST', {
                input: userInput
            });
            return response;
        } catch (error) {
            console.error('Failed to plan goal:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal planning failed'
            };
        }
    }

    /**
     * Analyze a goal using ADK agents
     */
    async analyzeGoal(goal: any): Promise<PythonADKResponse> {
        try {
            const response = await this.makeRequest('/api/analyze-goal', 'POST', {
                goal: goal
            });
            return response;
        } catch (error) {
            console.error('Failed to analyze goal:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal analysis failed'
            };
        }
    }

    /**
     * Generate SMART criteria using ADK agents
     */
    async generateSMARTCriteria(title: string, description: string = ''): Promise<PythonADKResponse> {
        try {
            const response = await this.makeRequest('/api/generate-smart-criteria', 'POST', {
                title: title,
                description: description
            });
            return response;
        } catch (error) {
            console.error('Failed to generate SMART criteria:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'SMART criteria generation failed'
            };
        }
    }

    /**
     * Refine a goal using ADK agents
     */
    async refineGoal(goal: any, feedback: string, maxIterations: number = 3): Promise<PythonADKResponse> {
        try {
            const response = await this.makeRequest('/api/refine-goal', 'POST', {
                goal: goal,
                feedback: feedback,
                max_iterations: maxIterations
            });
            return response;
        } catch (error) {
            console.error('Failed to refine goal:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Goal refinement failed'
            };
        }
    }

    /**
     * Make HTTP request to Python Flask API
     */
    private async makeRequest(
        endpoint: string,
        method: 'GET' | 'POST' = 'GET',
        data?: any
    ): Promise<PythonADKResponse> {
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
            return result as PythonADKResponse;

        } catch (error) {
            console.error(`Python ADK API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
}

// Singleton instance
let pythonADKService: PythonADKService | null = null;

export function getPythonADKService(): PythonADKService {
    if (!pythonADKService) {
        pythonADKService = new PythonADKService();
    }
    return pythonADKService;
}