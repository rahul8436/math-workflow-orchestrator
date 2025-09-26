import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

interface OperandNodeData {
  value?: number;
  label?: string;
  isVariable?: boolean;
  variableName?: string;
  onChange?: (value: number) => void;
}

interface OperandNodeProps {
  data: OperandNodeData;
  selected?: boolean;
  id: string;
}

export function OperandNode({ data, selected, id }: OperandNodeProps) {
  const [inputValue, setInputValue] = useState(() => {
    const val = data.value ?? 0;
    return val.toString();
  });

  const displayName = data.isVariable
    ? (data.variableName || data.label || 'X')
    : (data.label || 'Input');

  // Simple, direct value change handler
  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);

    // Parse the number, allow negative numbers and decimals
    const numericValue = rawValue === '' || rawValue === '-' ? 0 : parseFloat(rawValue);

    if (!isNaN(numericValue)) {
      // Update data immediately
      data.value = numericValue;
      data.onChange?.(numericValue);
    }
  }, [data]);

  // Clear input value when data changes from outside (workflow switch)
  useEffect(() => {
    const newValue = data.value ?? 0;
    setInputValue(newValue.toString());
  }, [data.value]);

  return (
    <div className={`bg-white border-2 rounded-lg p-2 shadow-lg min-w-[100px] max-w-[120px] transition-all ${
      selected ? 'border-blue-500 shadow-blue-200' : 'border-blue-300 hover:border-blue-400'
    }`}>
      <div className="text-center">
        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 bg-blue-50 px-1 py-0.5 rounded">
          {data.isVariable ? 'Variable' : 'Input'}
        </div>

        {data.isVariable ? (
          <div className="space-y-1">
            <div className="w-8 h-8 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs font-semibold text-blue-800">
              {displayName}
            </div>
            <input
              type="number"
              value={inputValue}
              onChange={handleValueChange}
              step="any"
              className="w-full px-2 py-1 border-2 border-gray-300 rounded text-center text-sm font-bold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="0"
              style={{ color: '#111827' }}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <input
              type="number"
              value={inputValue}
              onChange={handleValueChange}
              step="any"
              className="w-full px-2 py-1 border-2 border-gray-300 rounded text-center text-lg font-bold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="0"
              style={{ color: '#111827' }}
            />
            <div className="text-xs font-medium text-gray-600">{displayName}</div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-1">
          Current: {data.value ?? 0}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3B82F6',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  );
}