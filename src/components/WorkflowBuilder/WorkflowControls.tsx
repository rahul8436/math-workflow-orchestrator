'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Save, Download, Upload, ChevronDown, ChevronUp, Bug } from 'lucide-react';
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
  const [isDebugExpanded, setIsDebugExpanded] = useState(false); // Debug panel state
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(true); // Auto-execution toggle
  const [forceUpdate, setForceUpdate] = useState(0); // Force update counter
  const lastWorkflowId = useRef<string | null>(null);
  const lastNodesHash = useRef<string>('');
  const lastInputsHash = useRef<string>('');

  // Force component update when nodes change externally
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [nodes]);

  // Additional effect to specifically track operand value changes
  useEffect(() => {
    if (!autoExecuteEnabled) return;
    
    const operandValues = nodes
      .filter(n => n.type === 'operand')
      .map(n => ({ id: n.id, value: n.data.value }));
    
    const operandHash = JSON.stringify(operandValues);
    
    if (operandHash !== lastNodesHash.current && lastNodesHash.current !== '') {
      console.log('🎯 Operand values changed, forcing re-execution...', operandValues);
      
      // Small delay to ensure all updates are processed
      setTimeout(() => {
        if (activeWorkflow && nodes.length > 0) {
          executeWorkflow(true);
        }
      }, 50);
    }
    
    lastNodesHash.current = operandHash;
  }, [nodes.map(n => n.data.value).join(','), autoExecuteEnabled]); // Track value changes
  // Get variable nodes that need input values
  const getVariableNodes = () => {
    return nodes.filter(node =>
      (node.type === 'operand' && node.data.isVariable) ||
      node.type === 'variable'
    );
  };

  // Auto-execution effect - triggers when workflow, nodes, or inputs change
  useEffect(() => {
    if (!autoExecuteEnabled || !activeWorkflow || nodes.length === 0 || isExecuting) {
      return;
    }

    // Create more detailed hashes to detect meaningful changes
    const currentWorkflowId = activeWorkflow?.id || '';
    
    // Include more detailed node information for better change detection
    const currentNodesHash = JSON.stringify(nodes.map(n => ({ 
      id: n.id, 
      type: n.type, 
      value: n.data.value,
      operation: n.data.operation,
      label: n.data.label,
      isVariable: n.data.isVariable,
      variableName: n.data.variableName,
      // Include position to detect if nodes were moved/updated
      position: n.position
    })).sort((a, b) => a.id.localeCompare(b.id))); // Sort for consistent hashing
    
    const currentInputsHash = JSON.stringify(inputs);

    // Check if this is a meaningful change that should trigger execution
    const workflowChanged = currentWorkflowId !== lastWorkflowId.current;
    const nodesChanged = currentNodesHash !== lastNodesHash.current;
    const inputsChanged = currentInputsHash !== lastInputsHash.current;

    // Log changes for debugging
    if (workflowChanged) console.log('🔄 Workflow changed:', currentWorkflowId);
    if (nodesChanged) console.log('🔄 Nodes changed - triggering re-execution');
    if (inputsChanged) console.log('🔄 Inputs changed:', inputs);

    if (workflowChanged || nodesChanged || inputsChanged) {
      // For variable workflows, check if all required inputs are provided
      const variableNodes = getVariableNodes();
      const hasAllRequiredInputs = variableNodes.length === 0 || 
        variableNodes.every(node => {
          const varName = node.data.variableName || node.data.label || node.id;
          return inputs[varName] !== undefined && inputs[varName] !== null;
        });

      if (hasAllRequiredInputs) {
        console.log('🔄 Auto-executing workflow due to changes...');
        
        // Use a slightly longer delay to ensure all node updates are complete
        // and prevent too frequent executions during rapid changes
        const timeoutId = setTimeout(() => {
          console.log('🎯 Executing with current node values:', nodes.map(n => ({ 
            id: n.id, 
            type: n.type, 
            value: n.data.value 
          })));
          executeWorkflow(true);
        }, 150); // Increased from 100ms to 150ms

        // Update the refs to track current state
        lastWorkflowId.current = currentWorkflowId;
        lastNodesHash.current = currentNodesHash;
        lastInputsHash.current = currentInputsHash;

        return () => clearTimeout(timeoutId);
      } else {
        console.log('⏳ Waiting for all required inputs before auto-execution...');
        // Update refs even when not executing to prevent infinite loops
        lastWorkflowId.current = currentWorkflowId;
        lastNodesHash.current = currentNodesHash;
        lastInputsHash.current = currentInputsHash;
      }
    }
  }, [activeWorkflow, nodes, inputs, autoExecuteEnabled, isExecuting, forceUpdate]);

  // Initialize inputs for new workflows with default values
  useEffect(() => {
    if (activeWorkflow && activeWorkflow.id !== lastWorkflowId.current) {
      const variableNodes = getVariableNodes();
      if (variableNodes.length > 0) {
        const defaultInputs: Record<string, number> = {};
        variableNodes.forEach(node => {
          const varName = node.data.variableName || node.data.label || node.id;
          // Set default value to 0 if not already set
          if (inputs[varName] === undefined) {
            defaultInputs[varName] = 0;
          }
        });
        
        if (Object.keys(defaultInputs).length > 0) {
          setInputs(prev => ({ ...prev, ...defaultInputs }));
        }
      }
      lastWorkflowId.current = activeWorkflow.id;
    }
  }, [activeWorkflow]);
  const executeWorkflow = async (isAutoTriggered = false) => {
    if (!activeWorkflow || nodes.length === 0) return;
    setIsExecuting(true);
    try {
      if (isAutoTriggered) {
        console.log('🔄 Auto-executing workflow...');
      } else {
        console.log('▶️ Manually executing workflow...');
      }
      
      // Get the most current nodes from the store to ensure we have latest values
      const { nodes: freshNodes } = useWorkflowStore.getState();
      const currentNodes = freshNodes.length > 0 ? freshNodes : nodes;
      
      console.log('📊 Current node values being used:', currentNodes.map(n => ({ 
        id: n.id, 
        type: n.type, 
        value: n.data.value,
        operation: n.data.operation 
      })));
      
      let result = 0;
      
      // First, try to use the proper workflow executor if we have a complete workflow structure
      if (activeWorkflow && edges.length > 0) {
        console.log('Using proper workflow execution with nodes and edges');
        // Create a workflow template with current nodes for execution
        const workflowWithCurrentNodes = {
          ...activeWorkflow,
          nodes: currentNodes
        };
        const execution = workflowExecutor.execute(workflowWithCurrentNodes, inputs);
        result = execution.result;
      } else {
        // Fallback: try to construct expression and use executeExpression
        const operandNodes = currentNodes.filter(node => node.type === 'operand');
        console.log('Operand nodes:', operandNodes);
        
        if (activeWorkflow.exactExpression) {
          // If we have the exact expression, use it
          console.log('Using exact expression:', activeWorkflow.exactExpression);
          result = workflowExecutor.executeExpression(activeWorkflow.exactExpression, inputs);
        } else if (operandNodes.length >= 2 && activeWorkflow.operations.length === 1) {
          // Handle simple single-operation cases
          const operandValues = operandNodes.map(node => Number(node.data.value ?? 0));
          const operation = activeWorkflow.operations[0];
          
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
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }
        } else {
          // For complex expressions, construct the expression string and evaluate it properly
          console.warn('Complex expression detected, but no proper workflow structure available');
          console.warn('This may lead to incorrect results due to operator precedence issues');
          
          // Try to reconstruct the expression from the pattern and operand values
          if (activeWorkflow.pattern && operandNodes.length > 0) {
            let expression = activeWorkflow.pattern;
            const operandValues = operandNodes.map(node => Number(node.data.value ?? 0));
            console.log('📝 Reconstructing expression with values:', operandValues);
            
            // Replace pattern variables with actual values
            // This is a simplified approach - in practice, you'd want more robust pattern matching
            const variables = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            for (let i = 0; i < Math.min(variables.length, operandValues.length); i++) {
              expression = expression.replace(new RegExp(variables[i], 'g'), operandValues[i].toString());
            }
            
            console.log('Reconstructed expression:', expression);
            result = workflowExecutor.executeExpression(expression, inputs);
          } else {
            throw new Error('Cannot execute complex workflow without proper structure or expression');
          }
        }
      }
      
      console.log('Final calculated result:', result);
      
      // Get operand values for the execution record
      const operandNodes = currentNodes.filter(node => node.type === 'operand');
      const operandValues = operandNodes.map(node => Number(node.data.value ?? 0));
      console.log('💾 Final operand values for execution record:', operandValues);
      
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
  // REMOVED: calculateComplexExpression function was causing incorrect results
  // for complex expressions like (3+5) - 4*(6+9) because it ignored operator
  // precedence and parentheses, calculating left-to-right instead.
  // Now using proper workflow executor or expression parser instead.
  
  // Manual trigger for node value updates (can be called from workflow builder)
  const triggerAutoExecution = () => {
    if (autoExecuteEnabled && activeWorkflow && nodes.length > 0) {
      console.log('🔄 Manual trigger for auto-execution due to node updates...');
      setTimeout(() => {
        executeWorkflow(true);
      }, 50);
    }
  };

  // Expose the trigger function to global scope for workflow builder components
  useEffect(() => {
    (window as any).triggerWorkflowAutoExecution = triggerAutoExecution;
    return () => {
      delete (window as any).triggerWorkflowAutoExecution;
    };
  }, [autoExecuteEnabled, activeWorkflow, nodes.length]);
  
  const updateResultNodesDirectly = async (result: number) => {
    console.log('🎯 Updating result nodes with value:', result);
    
    // Update result nodes in the current local state immediately
    const updatedLocalNodes = nodes.map(node => {
      if (node.type === 'result') {
        console.log('� Found result node locally, updating:', node.id);
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
    
    // Update local state first for immediate UI response
    setNodes(updatedLocalNodes);
    
    // Then update the store state
    const { nodes: storeNodes, setNodes: setStoreNodes } = useWorkflowStore.getState();
    const updatedStoreNodes = storeNodes.map(node => {
      if (node.type === 'result') {
        console.log('� Found result node in store, updating:', node.id);
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
    
    // Force a final re-render to ensure consistency
    setTimeout(() => {
      setNodes([...updatedLocalNodes]);
    }, 10);
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
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Inputs
            </h5>
            {autoExecuteEnabled && (
              <span className="text-xs text-blue-600 font-medium">
                Auto-updating
              </span>
            )}
          </div>
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
            <div className="text-xs text-green-600 flex items-center justify-center gap-1">
              <span>Executed in {currentExecution.duration}ms</span>
              {autoExecuteEnabled && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  Auto
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Auto-Execute Toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">Auto Execute</span>
        <button
          onClick={() => setAutoExecuteEnabled(!autoExecuteEnabled)}
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            autoExecuteEnabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              autoExecuteEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      
      {/* Control Buttons - More compact */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => executeWorkflow(false)}
          disabled={!canExecute}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            canExecute
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={autoExecuteEnabled ? 'Manual execution (auto-execute is enabled)' : 'Execute workflow'}
        >
          {isExecuting ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {autoExecuteEnabled ? 'Manual' : 'Execute'}
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
      {/* Debug Section - Expandable */}
      <div className="border-t pt-2">
        {/* Debug Header - Always visible with stats */}
        <button
          onClick={() => setIsDebugExpanded(!isDebugExpanded)}
          className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bug className="w-3 h-3" />
            <span>{nodes.length} nodes • {edges.length} connections</span>
          </div>
          {isDebugExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {/* Expanded Debug Information */}
        {isDebugExpanded && (
          <div className="mt-2 space-y-2 text-xs">
            {/* Live Node Values */}
            <div className="space-y-1">
              <div className="font-medium text-gray-600 flex items-center gap-1">
                <span>Live Node Values:</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                {nodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        node.type === 'operand' ? 'bg-blue-100 text-blue-700' :
                        node.type === 'operator' ? 'bg-purple-100 text-purple-700' :
                        node.type === 'result' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {node.type}
                      </span>
                      <span className="font-medium">{node.data.label}</span>
                    </div>
                    <div className="text-right">
                      {node.data.value !== undefined ? (
                        <span className="font-mono text-green-600 font-bold">
                          {node.data.value}
                        </span>
                      ) : node.data.operation ? (
                        <span className="font-mono text-purple-600">
                          {getOperatorSymbol(node.data.operation)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Execution State */}
            {currentExecution && (
              <div className="space-y-1">
                <div className="font-medium text-gray-600">Execution State:</div>
                <div className="bg-green-50 rounded p-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Result:</span>
                    <span className="font-mono font-bold text-green-700">
                      {currentExecution.result}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-mono">{currentExecution.duration}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timestamp:</span>
                    <span className="font-mono">
                      {new Date(currentExecution.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Execute:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      autoExecuteEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {autoExecuteEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Workflow Info */}
            {activeWorkflow && (
              <div className="space-y-1">
                <div className="font-medium text-gray-600">Workflow Info:</div>
                <div className="bg-blue-50 rounded p-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium text-right">{activeWorkflow.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operations:</span>
                    <span className="font-mono text-purple-600">
                      {activeWorkflow.operations.map(op => getOperatorSymbol(op)).join(' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      activeWorkflow.complexity === 'basic' ? 'bg-green-100 text-green-700' :
                      activeWorkflow.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      activeWorkflow.complexity === 'advanced' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {activeWorkflow.complexity}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Connection Map */}
            <div className="space-y-1">
              <div className="font-medium text-gray-600">Connections:</div>
              <div className="bg-gray-50 rounded p-2 space-y-1 max-h-24 overflow-y-auto">
                {edges.map((edge) => (
                  <div key={edge.id} className="flex items-center justify-center text-xs">
                    <span className="font-mono text-blue-600">{edge.source}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-mono text-green-600">{edge.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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