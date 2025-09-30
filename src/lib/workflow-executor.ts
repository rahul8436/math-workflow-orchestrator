import { WorkflowTemplate, WorkflowExecution, ExecutionStep, OperationType, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export class WorkflowExecutor {
  execute(
    workflow: WorkflowTemplate,
    inputs: Record<string, number>
  ): WorkflowExecution {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const steps: ExecutionStep[] = [];
    const nodeValues: Record<string, number> = {};

    try {
      // Initialize operand nodes with input values
      this.initializeOperands(workflow.nodes, inputs, nodeValues);

      // Execute workflow in topological order
      const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges);

      for (const node of sortedNodes) {
        if (node.type === 'operator') {
          const step = this.executeOperatorNode(node, workflow.edges, nodeValues);
          steps.push(step);
          nodeValues[node.id] = step.result;
        }
      }

      // Get final result from the last operator that connects to a result node
      let finalResult = 0;
      const resultNode = workflow.nodes.find(n => n.type === 'result');

      if (resultNode) {
        // Find the edge that connects to the result node
        const resultEdge = workflow.edges.find(e => e.target === resultNode.id);
        if (resultEdge) {
          finalResult = nodeValues[resultEdge.source] || 0;
        }
      } else {
        // If no result node, use the last operator's result
        const lastStep = steps[steps.length - 1];
        finalResult = lastStep ? lastStep.result : 0;
      }

      const endTime = Date.now();

      return {
        id: executionId,
        workflowId: workflow.id,
        inputs,
        result: finalResult,
        steps,
        timestamp: new Date(),
        duration: endTime - startTime
      };

    } catch (error) {
      throw new Error(`Workflow execution failed: ${error.message}`);
    }
  }

  private initializeOperands(
    nodes: WorkflowNode[],
    inputs: Record<string, number>,
    nodeValues: Record<string, number>
  ): void {
    for (const node of nodes) {
      if (node.type === 'operand') {
        if (node.data.isVariable && node.data.variableName) {
          const variableName = node.data.variableName;
          if (inputs[variableName] !== undefined) {
            nodeValues[node.id] = inputs[variableName];
          } else {
            throw new Error(`Missing input value for variable: ${variableName}`);
          }
        } else if (typeof node.data.value === 'number') {
          nodeValues[node.id] = node.data.value;
        } else {
          throw new Error(`Invalid operand value for node: ${node.id}`);
        }
      }
    }
  }

  private executeOperatorNode(
    operatorNode: WorkflowNode,
    edges: WorkflowEdge[],
    nodeValues: Record<string, number>
  ): ExecutionStep {
    // Find input edges to this operator
    const inputEdges = edges.filter(edge => edge.target === operatorNode.id);

    if (inputEdges.length < 2 && operatorNode.data.operation !== 'subtraction') {
      throw new Error(`Insufficient operands for operator: ${operatorNode.id}`);
    }

    // Get operand values
    const operands: number[] = [];
    for (const edge of inputEdges) {
      const value = nodeValues[edge.source];
      if (value === undefined) {
        throw new Error(`Missing value for operand: ${edge.source}`);
      }
      operands.push(value);
    }

    // Perform operation
    const operation = operatorNode.data.operation;
    if (!operation) {
      throw new Error(`Missing operation for operator node: ${operatorNode.id}`);
    }

    const result = this.performOperation(operation, operands);

    return {
      stepId: `step-${operatorNode.id}`,
      operation,
      operands,
      result,
      nodeId: operatorNode.id
    };
  }

  private performOperation(operation: OperationType, operands: number[]): number {
    switch (operation) {
      case 'addition':
        return operands.reduce((sum, val) => sum + val, 0);

      case 'subtraction':
        if (operands.length === 1) {
          return -operands[0]; // Unary minus
        }
        return operands.reduce((diff, val, index) =>
          index === 0 ? val : diff - val
        );

      case 'multiplication':
        return operands.reduce((product, val) => product * val, 1);

      case 'division':
        if (operands.some(val => val === 0 && operands.indexOf(val) > 0)) {
          throw new Error('Division by zero');
        }
        return operands.reduce((quotient, val, index) =>
          index === 0 ? val : quotient / val
        );

      case 'exponentiation':
        if (operands.length !== 2) {
          throw new Error('Exponentiation requires exactly 2 operands');
        }
        return Math.pow(operands[0], operands[1]);

      case 'modulo':
        if (operands.length !== 2) {
          throw new Error('Modulo requires exactly 2 operands');
        }
        if (operands[1] === 0) {
          throw new Error('Modulo by zero');
        }
        return operands[0] % operands[1];

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const sorted: WorkflowNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error('Circular dependency detected in workflow');
      }

      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      // Visit dependencies first
      const dependencyEdges = edges.filter(edge => edge.target === nodeId);
      for (const edge of dependencyEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type === 'operator') {
        sorted.push(node);
      }
    };

    // Start with operator nodes that have inputs
    const operatorNodes = nodes.filter(n => n.type === 'operator');
    for (const node of operatorNodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return sorted;
  }

  // Utility method to validate workflow before execution
  validateWorkflow(workflow: WorkflowTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required nodes
    const hasOperands = workflow.nodes.some(n => n.type === 'operand');
    const hasOperators = workflow.nodes.some(n => n.type === 'operator');
    const hasResult = workflow.nodes.some(n => n.type === 'result');

    if (!hasOperands) errors.push('Workflow must have at least one operand');
    if (!hasOperators) errors.push('Workflow must have at least one operator');
    if (!hasResult) errors.push('Workflow must have a result node');

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    for (const edge of workflow.edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of workflow.nodes) {
      if (!connectedNodes.has(node.id) && workflow.nodes.length > 1) {
        errors.push(`Node ${node.id} is not connected to the workflow`);
      }
    }

    // Check for missing operations in operator nodes
    for (const node of workflow.nodes) {
      if (node.type === 'operator' && !node.data.operation) {
        errors.push(`Operator node ${node.id} is missing operation`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Quick execution for simple expressions
  executeExpression(expression: string, variables: Record<string, number> = {}): number {
    try {
      // Replace variables first, before sanitizing
      let processed = expression;
      for (const [variable, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        processed = processed.replace(regex, value.toString());
      }

      // Validate the expression contains only safe characters after variable replacement
      if (!/^[0-9+\-*/().\s]+$/.test(processed)) {
        throw new Error('Expression contains invalid characters after variable substitution');
      }

      // Validate the processed expression is not empty and has balanced parentheses
      if (!processed.trim()) {
        throw new Error('Empty expression after processing');
      }

      const openParens = (processed.match(/\(/g) || []).length;
      const closeParens = (processed.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        throw new Error('Unbalanced parentheses in expression');
      }

      // Evaluate safely using Function constructor
      // This respects operator precedence and parentheses correctly
      const result = Function(`"use strict"; return (${processed})`)();

      // Validate the result is a valid number
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Expression did not evaluate to a valid number');
      }

      return result;
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }
}

export const workflowExecutor = new WorkflowExecutor();