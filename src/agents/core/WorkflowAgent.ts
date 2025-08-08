// ADK Workflow Agent Base Class
import { ADKAgent, AgentContext, WorkflowResult, WorkflowContext } from './ADKAgent';

// Re-export WorkflowContext for use in other modules
export type { WorkflowContext } from './ADKAgent';

export type WorkflowType = 'sequential' | 'parallel' | 'loop';

export interface WorkflowStep {
    id: string;
    agentId: string;
    parameters: Record<string, any>;
    dependencies?: string[];
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    type: WorkflowType;
    steps: WorkflowStep[];
    maxRetries: number;
    timeout: number;
}

export abstract class WorkflowAgent extends ADKAgent {
    protected workflows: Map<string, WorkflowDefinition>;
    protected activeWorkflows: Map<string, WorkflowContext>;

    constructor(name: string, domain: string, capabilities: string[] = []) {
        super(name, domain, [...capabilities, 'workflow_orchestration']);
        this.workflows = new Map();
        this.activeWorkflows = new Map();
    }

    // Workflow Management
    registerWorkflow(workflow: WorkflowDefinition): void {
        this.workflows.set(workflow.id, workflow);
    }

    async executeWorkflow(workflowId: string, context: AgentContext, parameters: Record<string, any> = {}): Promise<WorkflowResult> {
        const startTime = Date.now();

        try {
            const workflow = this.workflows.get(workflowId);
            if (!workflow) {
                return {
                    success: false,
                    error: `Workflow ${workflowId} not found`,
                    executionTime: Date.now() - startTime,
                    agentId: this.id
                };
            }

            const workflowContext: WorkflowContext = {
                id: workflowId,
                type: workflow.type,
                agents: [], // Would be populated with actual agent instances
                context,
                parameters
            };

            this.activeWorkflows.set(workflowId, workflowContext);

            let result: WorkflowResult;

            switch (workflow.type) {
                case 'sequential':
                    result = await this.executeSequentialWorkflow(workflow, workflowContext);
                    break;
                case 'parallel':
                    result = await this.executeParallelWorkflow(workflow, workflowContext);
                    break;
                case 'loop':
                    result = await this.executeLoopWorkflow(workflow, workflowContext);
                    break;
                default:
                    result = {
                        success: false,
                        error: `Unknown workflow type: ${workflow.type}`,
                        executionTime: Date.now() - startTime,
                        agentId: this.id
                    };
            }

            this.activeWorkflows.delete(workflowId);
            return result;

        } catch (error) {
            this.activeWorkflows.delete(workflowId);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Workflow execution error',
                executionTime: Date.now() - startTime,
                agentId: this.id
            };
        }
    }

    // Abstract workflow execution methods
    protected abstract executeSequentialWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult>;
    protected abstract executeParallelWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult>;
    protected abstract executeLoopWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult>;

    // Workflow Status
    getActiveWorkflows(): string[] {
        return Array.from(this.activeWorkflows.keys());
    }

    getWorkflowStatus(workflowId: string): WorkflowContext | undefined {
        return this.activeWorkflows.get(workflowId);
    }

    async cancelWorkflow(workflowId: string): Promise<boolean> {
        const workflow = this.activeWorkflows.get(workflowId);
        if (workflow) {
            this.activeWorkflows.delete(workflowId);
            return true;
        }
        return false;
    }
}