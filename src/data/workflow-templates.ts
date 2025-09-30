import { WorkflowTemplate } from '@/types/workflow';

export const defaultWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'exact-3-plus-5',
    name: 'Addition: 3 + 5',
    description: 'Exact calculation for 3 + 5 = 8',
    pattern: '3 + 5',
    complexity: 'basic',
    operations: ['addition'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 3, label: '3' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 5, label: '5' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (8)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['addition', 'exact', 'three', 'five', 'eight'],
    examples: ['3 + 5', '3+5'],
    exactValues: [3, 5],
    exactExpression: '3+5',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-4-plus-7',
    name: 'Addition: 4 + 7',
    description: 'Exact calculation for 4 + 7 = 11',
    pattern: '4 + 7',
    complexity: 'basic',
    operations: ['addition'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 4, label: '4' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 7, label: '7' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (11)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['addition', 'exact', 'four', 'seven', 'eleven'],
    examples: ['4 + 7', '4+7'],
    exactValues: [4, 7],
    exactExpression: '4+7',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-10-plus-15',
    name: 'Demo: 10 + 15',
    description: 'Easy demo calculation: 10 + 15 = 25',
    pattern: '10 + 15',
    complexity: 'basic',
    operations: ['addition'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 10, label: '10' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 15, label: '15' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (25)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['addition', 'demo', 'ten', 'fifteen', 'twenty-five'],
    examples: ['10 + 15', '10+15'],
    exactValues: [10, 15],
    exactExpression: '10+15',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-20-minus-8',
    name: 'Demo: 20 - 8',
    description: 'Easy demo subtraction: 20 - 8 = 12',
    pattern: '20 - 8',
    complexity: 'basic',
    operations: ['subtraction'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 20, label: '20' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'subtraction', label: '-' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 8, label: '8' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (12)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['subtraction', 'demo', 'twenty', 'eight', 'twelve'],
    examples: ['20 - 8', '20-8'],
    exactValues: [20, 8],
    exactExpression: '20-8',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-6-times-4',
    name: 'Demo: 6 × 4',
    description: 'Easy demo multiplication: 6 × 4 = 24',
    pattern: '6 * 4',
    complexity: 'basic',
    operations: ['multiplication'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 6, label: '6' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 4, label: '4' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (24)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['multiplication', 'demo', 'six', 'four', 'twenty-four'],
    examples: ['6 * 4', '6×4', '6 times 4'],
    exactValues: [6, 4],
    exactExpression: '6*4',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-30-divide-6',
    name: 'Demo: 30 ÷ 6',
    description: 'Easy demo division: 30 ÷ 6 = 5',
    pattern: '30 / 6',
    complexity: 'basic',
    operations: ['division'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 30, label: '30' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 6, label: '6' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (5)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['division', 'demo', 'thirty', 'six', 'five'],
    examples: ['30 / 6', '30÷6', '30 divided by 6'],
    exactValues: [30, 6],
    exactExpression: '30/6',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-25-plus-35',
    name: 'Demo: 25 + 35',
    description: 'Medium demo calculation: 25 + 35 = 60',
    pattern: '25 + 35',
    complexity: 'basic',
    operations: ['addition'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 25, label: '25' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 35, label: '35' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (60)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['addition', 'demo', 'twenty-five', 'thirty-five', 'sixty'],
    examples: ['25 + 35', '25+35'],
    exactValues: [25, 35],
    exactExpression: '25+35',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-12-times-5',
    name: 'Demo: 12 × 5',
    description: 'Medium demo multiplication: 12 × 5 = 60',
    pattern: '12 * 5',
    complexity: 'basic',
    operations: ['multiplication'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 12, label: '12' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 5, label: '5' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (60)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['multiplication', 'demo', 'twelve', 'five', 'sixty'],
    examples: ['12 * 5', '12×5', '12 times 5'],
    exactValues: [12, 5],
    exactExpression: '12*5',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'demo-compound-calc',
    name: 'Demo: (8 + 12) ÷ 4',
    description: 'Compound demo: (8 + 12) ÷ 4 = 5',
    pattern: '(8 + 12) / 4',
    complexity: 'intermediate',
    operations: ['addition', 'division'],
    operandCount: 3,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 50, y: 100 },
        data: { value: 8, label: '8' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 200, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 50, y: 200 },
        data: { value: 12, label: '12' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 400, y: 150 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 200, y: 300 },
        data: { value: 4, label: '4' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 600, y: 150 },
        data: { label: 'Result (5)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-3', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'result-1' }
    ],
    tags: ['compound', 'demo', 'parentheses', 'order-of-operations'],
    examples: ['(8 + 12) / 4', '(8+12)÷4', '8 plus 12 divided by 4'],
    exactValues: [8, 12, 4],
    exactExpression: '(8+12)/4',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-15-plus-23',
    name: 'Addition: 15 + 23',
    description: 'Calculate 15 + 23 = 38',
    pattern: '15 + 23',
    complexity: 'basic',
    operations: ['addition'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 15, label: '15' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 23, label: '23' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (38)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['addition', 'exact', 'fifteen', 'twenty-three', 'thirty-eight'],
    examples: ['15 + 23', '15+23'],
    exactValues: [15, 23],
    exactExpression: '15+23',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-50-minus-18',
    name: 'Subtraction: 50 - 18',
    description: 'Calculate 50 - 18 = 32',
    pattern: '50 - 18',
    complexity: 'basic',
    operations: ['subtraction'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 50, label: '50' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'subtraction', label: '-' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 18, label: '18' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (32)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['subtraction', 'exact', 'fifty', 'eighteen', 'thirty-two'],
    examples: ['50 - 18', '50-18'],
    exactValues: [50, 18],
    exactExpression: '50-18',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-9-times-7',
    name: 'Multiplication: 9 × 7',
    description: 'Calculate 9 × 7 = 63',
    pattern: '9 * 7',
    complexity: 'basic',
    operations: ['multiplication'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 9, label: '9' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 100 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 7, label: '7' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 500, y: 150 },
        data: { label: 'Result (63)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'result-1' }
    ],
    tags: ['multiplication', 'exact', 'nine', 'seven', 'sixty-three'],
    examples: ['9 * 7', '9×7', '9 times 7'],
    exactValues: [9, 7],
    exactExpression: '9*7',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-100-plus-45-minus-28',
    name: 'Chain: 100 + 45 - 28',
    description: 'Calculate 100 + 45 - 28 = 117',
    pattern: '100 + 45 - 28',
    complexity: 'intermediate',
    operations: ['addition', 'subtraction'],
    operandCount: 3,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 100, label: '100' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 45, label: '45' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 150 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 100, y: 300 },
        data: { value: 28, label: '28' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 500, y: 225 },
        data: { operation: 'subtraction', label: '-' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 700, y: 225 },
        data: { label: 'Result (117)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-3', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'result-1' }
    ],
    tags: ['addition', 'subtraction', 'chain', 'exact', 'sequential'],
    examples: ['100 + 45 - 28', '100+45-28'],
    exactValues: [100, 45, 28],
    exactExpression: '100+45-28',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-5-plus-12-times-3',
    name: 'BODMAS: 5 + 12 × 3',
    description: 'Calculate 5 + 12 × 3 = 41 (order of operations)',
    pattern: '5 + 12 * 3',
    complexity: 'advanced',
    operations: ['addition', 'multiplication'],
    operandCount: 3,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 5, label: '5' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 250 },
        data: { value: 12, label: '12' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 100, y: 350 },
        data: { value: 3, label: '3' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 300 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 500, y: 200 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 700, y: 200 },
        data: { label: 'Result (41)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-2', target: 'operator-1' },
      { id: 'e2', source: 'operand-3', target: 'operator-1' },
      { id: 'e3', source: 'operand-1', target: 'operator-2' },
      { id: 'e4', source: 'operator-1', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'result-1' }
    ],
    tags: ['bodmas', 'precedence', 'multiplication', 'addition', 'exact'],
    examples: ['5 + 12 * 3', '5+12×3'],
    exactValues: [5, 12, 3],
    exactExpression: '5+12*3',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-20-plus-15-minus-24-div-4',
    name: 'Complex: 20 + 15 - 24 ÷ 4',
    description: 'Calculate 20 + 15 - 24 ÷ 4 = 29 (order of operations)',
    pattern: '20 + 15 - 24 / 4',
    complexity: 'complex',
    operations: ['addition', 'subtraction', 'division'],
    operandCount: 4,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 50, y: 100 },
        data: { value: 20, label: '20' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 50, y: 200 },
        data: { value: 15, label: '15' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 50, y: 350 },
        data: { value: 24, label: '24' }
      },
      {
        id: 'operand-4',
        type: 'operand',
        position: { x: 50, y: 450 },
        data: { value: 4, label: '4' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 250, y: 400 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 250, y: 150 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operator-3',
        type: 'operator',
        position: { x: 450, y: 275 },
        data: { operation: 'subtraction', label: '-' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 650, y: 275 },
        data: { label: 'Result (29)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-3', target: 'operator-1' },
      { id: 'e2', source: 'operand-4', target: 'operator-1' },
      { id: 'e3', source: 'operand-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-2', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'operator-3' },
      { id: 'e6', source: 'operator-1', target: 'operator-3' },
      { id: 'e7', source: 'operator-3', target: 'result-1' }
    ],
    tags: ['complex', 'four-operand', 'precedence', 'exact', 'mixed-operations'],
    examples: ['20 + 15 - 24 / 4', '20+15-24÷4'],
    exactValues: [20, 15, 24, 4],
    exactExpression: '20+15-24/4',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-25-percent-of-200',
    name: 'Percentage: 25% of 200',
    description: 'Calculate 25% of 200 = 50',
    pattern: '200 * 25 / 100',
    complexity: 'intermediate',
    operations: ['multiplication', 'division'],
    operandCount: 2,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 200, label: '200' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 25, label: '25' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 100, y: 350 },
        data: { value: 100, label: '100' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 150 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 500, y: 225 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 700, y: 225 },
        data: { label: 'Result (50)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-3', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'result-1' }
    ],
    tags: ['percentage', 'exact', 'twenty-five', 'two-hundred', 'fifty'],
    examples: ['25% of 200', '200 * 25 / 100'],
    exactValues: [200, 25, 100],
    exactExpression: '200*25/100',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-interest-5000-8-3',
    name: 'Simple Interest: ₹5000 at 8% for 3 years',
    description: 'Calculate interest: 5000 × 8 × 3 ÷ 100 = 1200',
    pattern: '5000 * 8 * 3 / 100',
    complexity: 'advanced',
    operations: ['multiplication', 'multiplication', 'division'],
    operandCount: 3,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 50, y: 100 },
        data: { value: 5000, label: '5000' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 50, y: 200 },
        data: { value: 8, label: '8' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 50, y: 300 },
        data: { value: 3, label: '3' }
      },
      {
        id: 'operand-4',
        type: 'operand',
        position: { x: 50, y: 450 },
        data: { value: 100, label: '100' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 250, y: 150 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 450, y: 225 },
        data: { operation: 'multiplication', label: '×' }
      },
      {
        id: 'operator-3',
        type: 'operator',
        position: { x: 650, y: 337 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 850, y: 337 },
        data: { label: 'Interest (1200)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-3', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'operator-3' },
      { id: 'e6', source: 'operand-4', target: 'operator-3' },
      { id: 'e7', source: 'operator-3', target: 'result-1' }
    ],
    tags: ['finance', 'interest', 'exact', 'five-thousand', 'eight-percent'],
    examples: ['5000 * 8 * 3 / 100', '5000×8×3÷100'],
    exactValues: [5000, 8, 3, 100],
    exactExpression: '5000*8*3/100',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  },
  {
    id: 'exact-average-85-92-78',
    name: 'Average: (85 + 92 + 78) ÷ 3',
    description: 'Calculate average of 85, 92, 78 = 85',
    pattern: '(85 + 92 + 78) / 3',
    complexity: 'intermediate',
    operations: ['addition', 'addition', 'division'],
    operandCount: 3,
    nodes: [
      {
        id: 'operand-1',
        type: 'operand',
        position: { x: 100, y: 100 },
        data: { value: 85, label: '85' }
      },
      {
        id: 'operand-2',
        type: 'operand',
        position: { x: 100, y: 200 },
        data: { value: 92, label: '92' }
      },
      {
        id: 'operand-3',
        type: 'operand',
        position: { x: 100, y: 300 },
        data: { value: 78, label: '78' }
      },
      {
        id: 'operand-4',
        type: 'operand',
        position: { x: 100, y: 450 },
        data: { value: 3, label: '3' }
      },
      {
        id: 'operator-1',
        type: 'operator',
        position: { x: 300, y: 150 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operator-2',
        type: 'operator',
        position: { x: 500, y: 225 },
        data: { operation: 'addition', label: '+' }
      },
      {
        id: 'operator-3',
        type: 'operator',
        position: { x: 700, y: 337 },
        data: { operation: 'division', label: '÷' }
      },
      {
        id: 'result-1',
        type: 'result',
        position: { x: 900, y: 337 },
        data: { label: 'Average (85)' }
      }
    ],
    edges: [
      { id: 'e1', source: 'operand-1', target: 'operator-1' },
      { id: 'e2', source: 'operand-2', target: 'operator-1' },
      { id: 'e3', source: 'operator-1', target: 'operator-2' },
      { id: 'e4', source: 'operand-3', target: 'operator-2' },
      { id: 'e5', source: 'operator-2', target: 'operator-3' },
      { id: 'e6', source: 'operand-4', target: 'operator-3' },
      { id: 'e7', source: 'operator-3', target: 'result-1' }
    ],
    tags: ['average', 'exact', 'statistics', 'eighty-five', 'ninety-two'],
    examples: ['(85 + 92 + 78) / 3', '(85+92+78)÷3'],
    exactValues: [85, 92, 78, 3],
    exactExpression: '(85+92+78)/3',
    createdAt: new Date('2024-01-01'),
    usageCount: 0
  }
];