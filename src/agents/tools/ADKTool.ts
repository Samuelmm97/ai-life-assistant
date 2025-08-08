// ADK Tool System - Base classes and interfaces for agent tools
import { ToolParameters, ToolResult } from '../core/ADKAgent';

export interface ToolMetadata {
    name: string;
    description: string;
    version: string;
    author?: string;
    category: 'search' | 'code' | 'data' | 'communication' | 'analysis' | 'custom';
    parameters: ToolParameterDefinition[];
}

export interface ToolParameterDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
    validation?: (value: any) => boolean;
}

export abstract class ADKTool {
    protected metadata: ToolMetadata;
    protected initialized: boolean = false;

    constructor(metadata: ToolMetadata) {
        this.metadata = metadata;
    }

    // Core tool methods
    abstract initialize(): Promise<void>;
    abstract execute(parameters: ToolParameters): Promise<ToolResult>;
    abstract cleanup(): Promise<void>;

    // Tool metadata
    getMetadata(): ToolMetadata {
        return { ...this.metadata };
    }

    getName(): string {
        return this.metadata.name;
    }

    getDescription(): string {
        return this.metadata.description;
    }

    getCategory(): string {
        return this.metadata.category;
    }

    // Parameter validation
    validateParameters(parameters: ToolParameters): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (const paramDef of this.metadata.parameters) {
            const value = parameters[paramDef.name];

            // Check required parameters
            if (paramDef.required && (value === undefined || value === null)) {
                errors.push(`Required parameter '${paramDef.name}' is missing`);
                continue;
            }

            // Skip validation for optional missing parameters
            if (value === undefined || value === null) {
                continue;
            }

            // Type validation
            if (!this.validateParameterType(value, paramDef.type)) {
                errors.push(`Parameter '${paramDef.name}' must be of type ${paramDef.type}`);
            }

            // Custom validation
            if (paramDef.validation && !paramDef.validation(value)) {
                errors.push(`Parameter '${paramDef.name}' failed custom validation`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    private validateParameterType(value: any, expectedType: string): boolean {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array':
                return Array.isArray(value);
            default:
                return false;
        }
    }

    // Execution wrapper with validation
    async safeExecute(parameters: ToolParameters): Promise<ToolResult> {
        try {
            // Validate parameters
            const validation = this.validateParameters(parameters);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Parameter validation failed: ${validation.errors.join(', ')}`
                };
            }

            // Ensure tool is initialized
            if (!this.initialized) {
                await this.initialize();
                this.initialized = true;
            }

            // Execute the tool
            return await this.execute(parameters);

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution error'
            };
        }
    }

    // Status
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Built-in tool implementations
export class SearchTool extends ADKTool {
    constructor() {
        super({
            name: 'search',
            description: 'Search for information using various search engines and sources',
            version: '1.0.0',
            category: 'search',
            parameters: [
                {
                    name: 'query',
                    type: 'string',
                    required: true,
                    description: 'The search query to execute'
                },
                {
                    name: 'source',
                    type: 'string',
                    required: false,
                    description: 'The search source to use (google, bing, etc.)',
                    defaultValue: 'google'
                },
                {
                    name: 'maxResults',
                    type: 'number',
                    required: false,
                    description: 'Maximum number of results to return',
                    defaultValue: 10
                }
            ]
        });
    }

    async initialize(): Promise<void> {
        console.log('Search tool initialized');
    }

    async execute(parameters: ToolParameters): Promise<ToolResult> {
        // Mock search implementation
        const query = parameters.query as string;
        const source = parameters.source as string || 'google';
        const maxResults = parameters.maxResults as number || 10;

        return {
            success: true,
            data: {
                query,
                source,
                results: Array.from({ length: Math.min(maxResults, 5) }, (_, i) => ({
                    title: `Search result ${i + 1} for "${query}"`,
                    url: `https://example.com/result-${i + 1}`,
                    snippet: `This is a mock search result snippet for query "${query}"`
                }))
            }
        };
    }

    async cleanup(): Promise<void> {
        console.log('Search tool cleaned up');
    }
}

export class CodeExecutionTool extends ADKTool {
    constructor() {
        super({
            name: 'code_execution',
            description: 'Execute code in various programming languages',
            version: '1.0.0',
            category: 'code',
            parameters: [
                {
                    name: 'code',
                    type: 'string',
                    required: true,
                    description: 'The code to execute'
                },
                {
                    name: 'language',
                    type: 'string',
                    required: true,
                    description: 'The programming language (javascript, python, etc.)'
                },
                {
                    name: 'timeout',
                    type: 'number',
                    required: false,
                    description: 'Execution timeout in milliseconds',
                    defaultValue: 5000
                }
            ]
        });
    }

    async initialize(): Promise<void> {
        console.log('Code execution tool initialized');
    }

    async execute(parameters: ToolParameters): Promise<ToolResult> {
        const code = parameters.code as string;
        const language = parameters.language as string;
        const timeout = parameters.timeout as number || 5000;

        // Mock code execution - in reality this would use a secure sandbox
        if (language === 'javascript') {
            try {
                // Very basic and unsafe evaluation - real implementation would use a sandbox
                const result = eval(code);
                return {
                    success: true,
                    data: {
                        language,
                        code,
                        result: String(result),
                        executionTime: Math.random() * 100
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: `JavaScript execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        }

        return {
            success: false,
            error: `Language ${language} not supported in mock implementation`
        };
    }

    async cleanup(): Promise<void> {
        console.log('Code execution tool cleaned up');
    }
}