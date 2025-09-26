import React from 'react';
import { Handle, Position } from 'reactflow';

interface VariableNodeData {
  value?: number | string;
  label?: string;
  variableName?: string;
  onChange?: (value: number) => void;
}

interface VariableNodeProps {
  data: VariableNodeData;
  selected?: boolean;
}

export function VariableNode({ data, selected }: VariableNodeProps) {
  const { value, label, variableName, onChange } = data;
  const displayName = variableName || label || 'Variable';

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange?.(newValue);
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-3 shadow-sm min-w-[100px] ${
      selected ? 'border-blue-500' : 'border-purple-300'
    }`}>
      <div className="text-center">
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
          Variable
        </div>

        <div className="space-y-2">
          {/* Variable Name */}
          <div className="w-10 h-10 mx-auto bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>

          {/* Variable Label */}
          <div className="text-sm font-medium text-purple-700">
            {displayName}
          </div>

          {/* Value Input */}
          <input
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={handleValueChange}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter value"
          />

          {typeof value === 'number' && (
            <div className="text-xs text-gray-500">
              Current: {value}
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#8B5CF6',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
    </div>
  );
}