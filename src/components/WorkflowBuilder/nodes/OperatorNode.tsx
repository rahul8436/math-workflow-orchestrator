import React from 'react';
import { Handle, Position } from 'reactflow';
import { OperationType } from '@/types/workflow';

interface OperatorNodeData {
  operation?: OperationType;
  label?: string;
  result?: number;
}

interface OperatorNodeProps {
  data: OperatorNodeData;
  selected?: boolean;
}

export function OperatorNode({ data, selected }: OperatorNodeProps) {
  const { operation, label, result } = data;

  const getOperatorSymbol = (op?: OperationType): string => {
    if (label) return label;

    const mapping: Record<OperationType, string> = {
      'addition': '+',
      'subtraction': '−',
      'multiplication': '×',
      'division': '÷',
      'exponentiation': '^',
      'modulo': '%'
    };
    return op ? mapping[op] : '?';
  };

  const getOperatorColors = (op?: OperationType) => {
    switch (op) {
      case 'addition': return { bg: 'bg-green-500', border: 'border-green-300', text: 'text-green-700' };
      case 'subtraction': return { bg: 'bg-red-500', border: 'border-red-300', text: 'text-red-700' };
      case 'multiplication': return { bg: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-700' };
      case 'division': return { bg: 'bg-orange-500', border: 'border-orange-300', text: 'text-orange-700' };
      case 'exponentiation': return { bg: 'bg-indigo-500', border: 'border-indigo-300', text: 'text-indigo-700' };
      case 'modulo': return { bg: 'bg-pink-500', border: 'border-pink-300', text: 'text-pink-700' };
      default: return { bg: 'bg-gray-500', border: 'border-gray-300', text: 'text-gray-700' };
    }
  };

  const colors = getOperatorColors(operation);
  const operatorName = operation?.replace(/([A-Z])/g, ' $1').trim() || 'Unknown';

  return (
    <div className={`bg-white border-2 rounded-lg shadow-lg min-w-[80px] max-w-[100px] transition-all ${
      selected ? 'border-blue-500 shadow-blue-200' : `${colors.border} hover:shadow-md`
    }`}>
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        style={{
          background: '#6B7280',
          width: 10,
          height: 10,
          border: '2px solid white',
          top: '30%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{
          background: '#6B7280',
          width: 10,
          height: 10,
          border: '2px solid white',
          top: '70%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />

      {/* Node Content */}
      <div className="p-2 text-center">
        <div className={`text-xs font-bold uppercase tracking-wide mb-1 px-1 py-0.5 rounded ${colors.text} bg-opacity-10 ${colors.bg}`}>
          Operator
        </div>

        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${colors.bg} hover:scale-105 transition-transform`}>
          {getOperatorSymbol(operation)}
        </div>

        <div className={`text-xs font-semibold mt-1 capitalize ${colors.text}`}>
          {operatorName}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colors.bg.includes('green') ? '#10B981' :
                     colors.bg.includes('red') ? '#EF4444' :
                     colors.bg.includes('purple') ? '#8B5CF6' :
                     colors.bg.includes('orange') ? '#F59E0B' :
                     colors.bg.includes('indigo') ? '#6366F1' :
                     colors.bg.includes('pink') ? '#EC4899' : '#6B7280',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  );
}