export type OperationType =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'exponentiation'
  | 'modulo';

export type NodeType =
  | 'operand'
  | 'operator'
  | 'result'
  | 'variable'
  | 'group';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    value?: number | string;
    operation?: OperationType;
    label?: string;
    isVariable?: boolean;
    variableName?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string; // "x + y", "x - y / z", etc.
  complexity: 'basic' | 'intermediate' | 'advanced' | 'complex';
  operations: OperationType[];
  operandCount: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
  examples: string[];
  exactValues?: number[]; // For exact numerical matching like [3, 5] for "3+5"
  exactExpression?: string; // For exact expression matching like "3+5"
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface ParsedExpression {
  tokens: Token[];
  ast: ExpressionNode;
  variables: string[];
  operations: OperationType[];
  complexity: number;
}

export interface Token {
  type: 'number' | 'operator' | 'variable' | 'parenthesis';
  value: string | number;
  position: number;
}

export interface ExpressionNode {
  type: 'operator' | 'operand' | 'group';
  value?: number | string | OperationType;
  left?: ExpressionNode;
  right?: ExpressionNode;
  children?: ExpressionNode[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  inputs: Record<string, number>;
  result: number;
  steps: ExecutionStep[];
  timestamp: Date;
  duration: number;
}

export interface ExecutionStep {
  stepId: string;
  operation: OperationType;
  operands: number[];
  result: number;
  nodeId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflowSuggestions?: WorkflowSuggestion[];
  createdWorkflow?: string; // workflow ID if created
  createdWorkflowName?: string; // workflow name for display
  orchestration?: OrchestrationPlan;
  fallbackAnalysis?: AIAnalysis; // Manual analysis when AI orchestration fails
}

export interface WorkflowSuggestion {
  workflowId: string;
  name: string;
  confidence: number;
  reason: string;
  matchType: 'exact' | 'partial' | 'similar' | 'natural_language' | 'create_new';
}

export interface AIAnalysis {
  intent: 'find_workflow' | 'create_workflow' | 'execute_workflow' | 'explain' | 'general';
  expression?: string;
  extractedNumbers: number[];
  extractedOperations: OperationType[];
  variables: string[];
  confidence: number;
  suggestedAction: string;
  reasoning?: string;
}

export interface OrchestrationPlan {
  intent: 'find' | 'create' | 'modify' | 'explain' | 'execute';
  confidence: number;
  reasoning: string;
  suggestedActions: OrchestrationAction[];
  alternativeOptions: string[];
}

export interface OrchestrationAction {
  type: 'search_workflows' | 'create_workflow' | 'explain_concept' | 'suggest_learning_path';
  parameters: Record<string, any>;
  priority: number;
  reasoning: string;
}