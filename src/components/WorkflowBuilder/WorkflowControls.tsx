'use client';

import { useState } from 'react';
import { Play, Square, RotateCcw, Save, Download, Upload } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { workflowExecutor } from '@/lib/workflow-executor';

export function WorkflowControls() {
  const {
    activeWorkflow,
    nodes,
    edges,
    currentExecution,
    addExecution,
    setCurrentExecution,
    clearWorkflow,
    setNodes,
  } = useWorkflowStore();

  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [isExecuting, setIsExecuting] = useState(false);

  // Get variable nodes that need input values
  const getVariableNodes = () => {
    return nodes.filter(node =>
      (node.type === 'operand' && node.data.isVariable) ||
      node.type === 'variable'
    );
  };

  const executeWorkflow = async () => {
    if (!activeWorkflow || nodes.length === 0) return;

    setIsExecuting(true);
    try {
      // Get all operand values from nodes in order
      const operandNodes = nodes.filter(node => node.type === 'operand');
      const operandValues = operandNodes.map(node => Number(node.data.value ?? 0));

      console.log('All operand nodes:', operandNodes);
      console.log('All operand values:', operandValues);
      console.log('Active workflow operations:', activeWorkflow.operations);

      // Handle different workflow types and complex operations
      let result = 0;

      if (activeWorkflow.operations.length === 1) {
        // Single operation workflows
        const operation = activeWorkflow.operations[0];
        if (operandValues.length >= 2) {
          switch (operation) {
            case 'addition':
              result = operandValues.reduce((sum, val) => sum + val, 0);
              break;
            case 'subtraction':
              result = operandValues[0] - operandValues.slice(1).reduce((sum, val) => sum + val, 0);
              break;
            case 'multiplication':
              result = operandValues.reduce((product, val) => product * val, 1);
              break;
            case 'division':
              result = operandValues.reduce((quotient, val, index) =>
                index === 0 ? val : (val !== 0 ? quotient / val : quotient)
              );
              break;
          }
        }
      } else {
        // Complex operations - handle multiple operations in sequence
        result = calculateComplexExpression(operandValues, activeWorkflow.operations);
      }

      console.log('Final calculated result:', result);

      // Create execution object
      const execution = {
        id: `exec-${Date.now()}`,
        workflowId: activeWorkflow.id,
        inputs: operandValues.reduce((acc, val, index) => {
          acc[`input${index + 1}`] = Number(val);
          return acc;
        }, {} as Record<string, number>),
        result,
        steps: [],
        timestamp: new Date(),
        duration: 10
      };

      addExecution(execution);
      setCurrentExecution(execution);

      // Update result nodes using direct ReactFlow method
      if ((window as any).updateWorkflowResult) {
        (window as any).updateWorkflowResult(result);
      } else {
        // Fallback method
        await updateResultNodesDirectly(result);
      }

    } catch (error: any) {
      console.error('Execution error:', error);
      alert(`Execution failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Calculate complex expressions with multiple operations
  const calculateComplexExpression = (values: number[], operations: string[]): number => {
    if (values.length < 2 || operations.length === 0) return 0;

    let result = values[0];

    // Apply operations in sequence
    for (let i = 0; i < operations.length && i + 1 < values.length; i++) {
      const operation = operations[i];
      const nextValue = values[i + 1];

      switch (operation) {
        case 'addition':
          result += nextValue;
          break;
        case 'subtraction':
          result -= nextValue;
          break;
        case 'multiplication':
          result *= nextValue;
          break;
        case 'division':
          result = nextValue !== 0 ? result / nextValue : result;
          break;
      }
    }

    return result;
  };

  const updateResultNodesDirectly = async (result: number) => {
    console.log('🎯 Updating result nodes with value:', result);

    // Force update both store and local state
    const { nodes: storeNodes, setNodes: setStoreNodes } = useWorkflowStore.getState();

    // Update workflow store first
    const updatedStoreNodes = storeNodes.map(node => {
      if (node.type === 'result') {
        console.log('📊 Found result node in store, updating:', node.id);
        return {
          ...node,
          data: {
            ...node.data,
            value: result
          }
        };
      }
      return node;
    });

    setStoreNodes(updatedStoreNodes);

    // Update local nodes state
    const updatedLocalNodes = nodes.map(node => {
      if (node.type === 'result') {
        console.log('🔄 Found result node locally, updating:', node.id);
        return {
          ...node,
          data: {
            ...node.data,
            value: result
          }
        };
      }
      return node;
    });

    setNodes(updatedLocalNodes);

    // Force a re-render
    setTimeout(() => {
      setNodes([...updatedLocalNodes]);
    }, 50);
  };

  const updateResultNodes = updateResultNodesDirectly;

  const resetWorkflow = () => {
    setCurrentExecution(null);
    setInputs({});

    // Reset all result nodes to show no value
    const updatedNodes = nodes.map(node => {
      if (node.type === 'result') {
        return {
          ...node,
          data: {
            ...node.data,
            value: undefined
          }
        };
      }
      return node;
    });

    setNodes(updatedNodes);
  };

  const clearCurrentWorkflow = () => {
    if (confirm('Clear current workflow? This will remove all nodes and connections.')) {
      clearWorkflow();
      setInputs({});
      setCurrentExecution(null);
    }
  };

  const saveWorkflow = () => {
    if (!activeWorkflow) return;

    // Create a downloadable JSON file
    const dataStr = JSON.stringify(activeWorkflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${activeWorkflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const variableNodes = getVariableNodes();
  const canExecute = activeWorkflow && nodes.length > 0 && !isExecuting;
  const hasResult = currentExecution !== null;

  return (
    <div className="space-y-3">
      {/* Workflow Info - More compact */}
      {activeWorkflow && (
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 text-xs">
            {activeWorkflow.name}
          </h4>
          <p className="text-xs text-gray-600">
            {activeWorkflow.pattern}
          </p>
        </div>
      )}

      {/* Variable Inputs - Compact */}
      {variableNodes.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Inputs
          </h5>
          {variableNodes.map((node) => {
            const varName = node.data.variableName || node.data.label || node.id;
            return (
              <div key={node.id} className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 min-w-0 flex-1">
                  {varName}:
                </label>
                <input
                  type="number"
                  value={inputs[varName] || ''}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    [varName]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Execution Result - Compact */}
      {hasResult && currentExecution && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-bold text-green-800">
              Result: {currentExecution.result}
            </div>
            <div className="text-xs text-green-600">
              Executed in {currentExecution.duration}ms
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons - More compact */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={executeWorkflow}
          disabled={!canExecute}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            canExecute
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExecuting ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          Execute
        </button>

        <button
          onClick={resetWorkflow}
          disabled={!hasResult}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            hasResult
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <button
          onClick={saveWorkflow}
          disabled={!activeWorkflow}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            activeWorkflow
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-3 h-3" />
          Export
        </button>

        <button
          onClick={clearCurrentWorkflow}
          disabled={nodes.length === 0}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            nodes.length > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Square className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Quick Stats - Compact */}
      <div className="text-xs text-gray-500 text-center border-t pt-2">
        {nodes.length} nodes • {edges.length} connections
      </div>
    </div>
  );
}

function getOperatorSymbol(operation: string): string {
  const mapping: Record<string, string> = {
    'addition': '+',
    'subtraction': '-',
    'multiplication': '×',
    'division': '÷',
    'exponentiation': '^',
    'modulo': '%'
  };
  return mapping[operation] || operation;
}