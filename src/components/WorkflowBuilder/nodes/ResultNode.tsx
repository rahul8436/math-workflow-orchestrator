import React from 'react';
import { Handle, Position } from 'reactflow';

interface ResultNodeData {
  value?: number;
  label?: string;
}

interface ResultNodeProps {
  data: ResultNodeData;
  selected?: boolean;
}

export function ResultNode({ data, selected }: ResultNodeProps) {
  const { value, label = 'Result' } = data;

  console.log('ResultNode rendered with value:', value, 'data:', data);

  return (
    <div className={`bg-white border-2 rounded-lg p-2 shadow-lg min-w-[110px] max-w-[130px] transition-all ${
      selected ? 'border-blue-500 shadow-blue-200' : 'border-green-400 hover:border-green-500 hover:shadow-green-200'
    }`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#10B981',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />

      <div className="text-center">
        <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 bg-green-50 px-2 py-0.5 rounded-full">
          {label}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-3 shadow-inner">
          {value !== undefined && value !== null ? (
            <>
              <div className="text-2xl font-bold text-green-800 mb-1">
                {typeof value === 'number' ?
                  (Number.isInteger(value) ? value : value.toFixed(2)) :
                  value
                }
              </div>
              <div className="text-xs text-green-600 font-medium">
                Final Answer
              </div>
            </>
          ) : (
            <>
              <div className="text-xl text-gray-400 font-bold mb-1">
                ?
              </div>
              <div className="text-xs text-gray-500">
                Awaiting calculation
              </div>
            </>
          )}
        </div>

        {value !== undefined && (
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}