'use client';

import { useState } from 'react';
import { Plus, X, Save, Play } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowTemplate, OperationType, WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface WorkflowCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowCreator({ isOpen, onClose }: WorkflowCreatorProps) {
  const { addTemplate, loadTemplate } = useWorkflowStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [operations, setOperations] = useState<OperationType[]>([]);
  const [operandCount, setOperandCount] = useState(2);

  const availableOperations: { value: OperationType; label: string; symbol: string }[] = [
    { value: 'addition', label: 'Addition', symbol: '+' },
    { value: 'subtraction', label: 'Subtraction', symbol: '−' },
    { value: 'multiplication', label: 'Multiplication', symbol: '×' },
    { value: 'division', label: 'Division', symbol: '÷' },
    { value: 'exponentiation', label: 'Exponentiation', symbol: '^' },
    { value: 'modulo', label: 'Modulo', symbol: '%' },
  ];

  const toggleOperation = (operation: OperationType) => {
    setOperations(prev =>
      prev.includes(operation)
        ? prev.filter(op => op !== operation)
        : [...prev, operation]
    );
  };

  const generateSimpleWorkflow = (): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    let yPos = 100;
    let xPos = 100;
    const spacing = 150;

    // Create operand nodes
    for (let i = 0; i < operandCount; i++) {
      nodes.push({
        id: `operand-${i + 1}`,
        type: 'operand',
        position: { x: xPos, y: yPos + (i * 100) },
        data: {
          value: 0,
          label: `Input ${i + 1}`,
        },
      });
    }

    xPos += spacing;

    // Create operator nodes (chain them if multiple operations)
    let previousNodeId = '';
    operations.forEach((operation, index) => {
      const operatorId = `operator-${index + 1}`;

      nodes.push({
        id: operatorId,
        type: 'operator',
        position: { x: xPos, y: yPos + (index * 100) },
        data: {
          operation,
          label: availableOperations.find(op => op.value === operation)?.symbol,
        },
      });

      // Connect operands to first operator
      if (index === 0) {
        for (let i = 0; i < Math.min(operandCount, 2); i++) {
          edges.push({
            id: `edge-operand-${i + 1}-${operatorId}`,
            source: `operand-${i + 1}`,
            target: operatorId,
          });
        }
      } else {
        // Connect previous operator to current operator
        edges.push({
          id: `edge-${previousNodeId}-${operatorId}`,
          source: previousNodeId,
          target: operatorId,
        });

        // Connect remaining operands if any
        const remainingOperandIndex = index + 1;
        if (remainingOperandIndex < operandCount) {
          edges.push({
            id: `edge-operand-${remainingOperandIndex + 1}-${operatorId}`,
            source: `operand-${remainingOperandIndex + 1}`,
            target: operatorId,
          });
        }
      }

      previousNodeId = operatorId;
      xPos += spacing;
    });

    // Create result node
    const resultId = 'result-1';
    nodes.push({
      id: resultId,
      type: 'result',
      position: { x: xPos, y: yPos + 50 },
      data: {
        label: 'Result',
      },
    });

    // Connect last operator to result
    if (operations.length > 0) {
      edges.push({
        id: `edge-${previousNodeId}-${resultId}`,
        source: previousNodeId,
        target: resultId,
      });
    }

    return { nodes, edges };
  };

  const handleSave = () => {
    if (!name.trim() || operations.length === 0) {
      alert('Please provide a name and select at least one operation.');
      return;
    }

    const { nodes, edges } = generateSimpleWorkflow();

    const workflow: WorkflowTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Custom workflow with ${operations.join(', ')}`,
      pattern: generatePattern(),
      complexity: operations.length === 1 ? 'basic' : operations.length <= 2 ? 'intermediate' : 'advanced',
      operations,
      operandCount,
      nodes,
      edges,
      tags: ['custom', 'user-created', ...operations],
      examples: [generatePattern()],
      createdAt: new Date(),
      usageCount: 0,
    };

    addTemplate(workflow);
    onClose();
    resetForm();

    // Auto-load the created workflow
    loadTemplate(workflow);
  };

  const generatePattern = (): string => {
    if (operations.length === 0) return 'custom';

    const symbols = operations.map(op =>
      availableOperations.find(o => o.value === op)?.symbol || '?'
    );

    if (operations.length === 1) {
      return `x ${symbols[0]} y`;
    } else if (operations.length === 2) {
      return `x ${symbols[0]} y ${symbols[1]} z`;
    } else {
      return `x ${symbols[0]} y ${symbols[1]} z ${symbols[2]} ...`;
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setOperations([]);
    setOperandCount(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4" style={{ color: '#111827' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Custom Workflow</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
              Workflow Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom Calculator"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: '#111827' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ color: '#111827' }}
            />
          </div>

          {/* Operand Count */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ color: '#374151' }}>
              Number of Inputs
            </label>
            <select
              value={operandCount}
              onChange={(e) => setOperandCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: '#111827' }}
            >
              <option value={2}>2 inputs</option>
              <option value={3}>3 inputs</option>
              <option value={4}>4 inputs</option>
              <option value={5}>5 inputs</option>
            </select>
          </div>

          {/* Operations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ color: '#374151' }}>
              Operations * (Select in order)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableOperations.map((operation) => (
                <button
                  key={operation.value}
                  onClick={() => toggleOperation(operation.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    operations.includes(operation.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-xl font-bold mb-1">{operation.symbol}</div>
                  <div className="text-xs">{operation.label}</div>
                </button>
              ))}
            </div>

            {operations.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Pattern Preview:
                </div>
                <div className="text-lg font-mono text-blue-900">
                  {generatePattern()}
                </div>
              </div>
            )}
          </div>

          {/* Selected Operations Order */}
          {operations.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Operation Order
              </label>
              <div className="flex flex-wrap gap-2">
                {operations.map((operation, index) => {
                  const opInfo = availableOperations.find(op => op.value === operation);
                  return (
                    <div
                      key={`${operation}-${index}`}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span className="font-bold">{index + 1}.</span>
                      <span>{opInfo?.symbol}</span>
                      <span>{opInfo?.label}</span>
                      <button
                        onClick={() => setOperations(prev => prev.filter((_, i) => i !== index))}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || operations.length === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              name.trim() && operations.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}