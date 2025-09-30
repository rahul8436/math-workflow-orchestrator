import { WorkflowExecutor } from '../../src/lib/workflow-executor';
import { OperationType } from '../../src/types/workflow';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
  });

  describe('executeExpression', () => {
    describe('Basic arithmetic operations', () => {
      test('should add two positive numbers', () => {
        expect(executor.executeExpression('3 + 5')).toBe(8);
      });

      test('should subtract numbers', () => {
        expect(executor.executeExpression('10 - 4')).toBe(6);
      });

      test('should multiply numbers', () => {
        expect(executor.executeExpression('6 * 7')).toBe(42);
      });

      test('should divide numbers', () => {
        expect(executor.executeExpression('15 / 3')).toBe(5);
      });

      test('should handle negative numbers', () => {
        expect(executor.executeExpression('-5 + 3')).toBe(-2);
        expect(executor.executeExpression('5 + (-3)')).toBe(2);
      });

      test('should handle decimal numbers', () => {
        expect(executor.executeExpression('3.5 + 2.1')).toBeCloseTo(5.6);
        expect(executor.executeExpression('10.5 / 2')).toBe(5.25);
      });

      test('should handle zero', () => {
        expect(executor.executeExpression('0 + 5')).toBe(5);
        expect(executor.executeExpression('5 * 0')).toBe(0);
        expect(executor.executeExpression('0 - 5')).toBe(-5);
      });
    });

    describe('Operator precedence', () => {
      test('should respect multiplication before addition', () => {
        expect(executor.executeExpression('2 + 3 * 4')).toBe(14);
      });

      test('should respect division before subtraction', () => {
        expect(executor.executeExpression('10 - 6 / 2')).toBe(7);
      });

      test('should handle mixed precedence', () => {
        expect(executor.executeExpression('2 + 3 * 4 - 5')).toBe(9);
        expect(executor.executeExpression('10 / 2 + 3 * 4')).toBe(17);
      });
    });

    describe('Parentheses handling', () => {
      test('should handle simple parentheses', () => {
        expect(executor.executeExpression('(2 + 3) * 4')).toBe(20);
        expect(executor.executeExpression('(10 - 6) / 2')).toBe(2);
      });

      test('should handle nested parentheses', () => {
        expect(executor.executeExpression('((2 + 3) * 4) - 8')).toBe(12);
        expect(executor.executeExpression('(10 + (5 * 2))')).toBe(20);
      });

      test('should handle complex expression with parentheses', () => {
        expect(executor.executeExpression('(3+5) - 4*(6+9)')).toBe(-52);
        expect(executor.executeExpression('(8 + 12) / (5 - 1)')).toBe(5);
      });

      test('should handle multiple levels of nesting', () => {
        expect(executor.executeExpression('(((2 + 3) * 4) - 8) / 2')).toBe(6);
      });
    });

    describe('Variable substitution', () => {
      test('should substitute single variable', () => {
        expect(executor.executeExpression('a + 5', { a: 3 })).toBe(8);
      });

      test('should substitute multiple variables', () => {
        expect(executor.executeExpression('a + b', { a: 3, b: 5 })).toBe(8);
        expect(executor.executeExpression('a * b + c', { a: 2, b: 3, c: 4 })).toBe(10);
      });

      test('should handle complex expressions with variables', () => {
        expect(executor.executeExpression('(a+b) - c*(d+e)', { 
          a: 3, b: 5, c: 4, d: 6, e: 9 
        })).toBe(-52);
      });

      test('should handle variable names that could be substrings', () => {
        expect(executor.executeExpression('a + ab', { a: 5, ab: 10 })).toBe(15);
      });
    });

    describe('Edge cases', () => {
      test('should handle very large numbers', () => {
        const result = executor.executeExpression('1000000 * 1000000');
        expect(result).toBe(1000000000000);
      });

      test('should handle very small decimals', () => {
        const result = executor.executeExpression('0.1 + 0.2');
        expect(result).toBeCloseTo(0.3);
      });

      test('should handle expressions with extra whitespace', () => {
        expect(executor.executeExpression('  3  +  5  ')).toBe(8);
        expect(executor.executeExpression('10    -    4')).toBe(6);
      });

      test('should handle single number', () => {
        expect(executor.executeExpression('42')).toBe(42);
        expect(executor.executeExpression('-42')).toBe(-42);
      });

      test('should handle expression starting with operator', () => {
        expect(executor.executeExpression('+5')).toBe(5);
        expect(executor.executeExpression('-5')).toBe(-5);
      });
    });

    describe('Error handling', () => {
      test('should throw on invalid expressions', () => {
        expect(() => executor.executeExpression('3 +')).toThrow();
        expect(() => executor.executeExpression('3 ++')).toThrow();
      });

      test('should throw on unbalanced parentheses', () => {
        expect(() => executor.executeExpression('(3 + 5')).toThrow('Unbalanced parentheses');
        expect(() => executor.executeExpression('3 + 5)')).toThrow('Unbalanced parentheses');
        expect(() => executor.executeExpression('((3 + 5)')).toThrow('Unbalanced parentheses');
      });

      test('should throw on empty expressions', () => {
        expect(() => executor.executeExpression('')).toThrow();
        expect(() => executor.executeExpression('   ')).toThrow();
      });

      test('should throw on invalid characters', () => {
        expect(() => executor.executeExpression('3 + a')).toThrow();
        expect(() => executor.executeExpression('3 & 5')).toThrow();
      });

      test('should handle division by zero in expression', () => {
        // Division by zero should throw an error  with safe evaluation
        expect(() => executor.executeExpression('10 / 0')).toThrow();
      });

      test('should handle missing variable values', () => {
        expect(() => executor.executeExpression('a + 5', {})).toThrow();
      });
    });

    describe('Complex real-world expressions', () => {
      test('should handle financial calculation', () => {
        // Calculate compound interest: P * (1 + r)^n
        const principal = 1000;
        const rate = 0.05;
        const result = executor.executeExpression('p * ((1 + r) * (1 + r))', {
          p: principal,
          r: rate
        });
        expect(result).toBeCloseTo(1102.5);
      });

      test('should handle percentage calculation', () => {
        const result = executor.executeExpression('(part / total) * 100', {
          part: 25,
          total: 200
        });
        expect(result).toBe(12.5);
      });

      test('should handle average calculation', () => {
        const result = executor.executeExpression('(a + b + c + d) / 4', {
          a: 10,
          b: 20,
          c: 30,
          d: 40
        });
        expect(result).toBe(25);
      });
    });
  });

  describe('validateWorkflow', () => {
    const createValidWorkflow = () => ({
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'A test workflow',
      pattern: 'a + b',
      complexity: 'basic' as const,
      operations: ['addition'] as OperationType[],
      operandCount: 2,
      nodes: [
        {
          id: 'operand1',
          type: 'operand' as const,
          position: { x: 0, y: 0 },
          data: { value: 3 }
        },
        {
          id: 'operand2',
          type: 'operand' as const,
          position: { x: 100, y: 0 },
          data: { value: 5 }
        },
        {
          id: 'operator1',
          type: 'operator' as const,
          position: { x: 50, y: 100 },
          data: { operation: 'addition' as const }
        },
        {
          id: 'result1',
          type: 'result' as const,
          position: { x: 50, y: 200 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1', source: 'operand1', target: 'operator1' },
        { id: 'e2', source: 'operand2', target: 'operator1' },
        { id: 'e3', source: 'operator1', target: 'result1' }
      ],
      tags: ['test'],
      examples: ['3 + 5'],
      createdAt: new Date(),
      usageCount: 0
    });

    test('should validate a complete workflow', () => {
      const workflow = createValidWorkflow();
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing operands', () => {
      const workflow = createValidWorkflow();
      workflow.nodes = workflow.nodes.filter(n => n.type !== 'operand');
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Workflow must have at least one operand');
    });

    test('should detect missing operators', () => {
      const workflow = createValidWorkflow();
      workflow.nodes = workflow.nodes.filter(n => n.type !== 'operator');
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Workflow must have at least one operator');
    });

    test('should detect missing result node', () => {
      const workflow = createValidWorkflow();
      workflow.nodes = workflow.nodes.filter(n => n.type !== 'result');
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Workflow must have a result node');
    });

    test('should detect missing operation in operator node', () => {
      const workflow = createValidWorkflow();
      const operatorNode = workflow.nodes.find(n => n.type === 'operator');
      if (operatorNode) {
        delete operatorNode.data.operation;
      }
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should handle empty workflow', () => {
      const workflow = createValidWorkflow();
      workflow.nodes = [];
      workflow.edges = [];
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should validate workflow with multiple operators', () => {
      const workflow = createValidWorkflow();
      workflow.operations = ['addition', 'multiplication'];
      (workflow.nodes as any[]).push({
        id: 'operator2',
        type: 'operator' as const,
        position: { x: 150, y: 150 },
        data: { operation: 'multiplication' as OperationType }
      });
      workflow.edges.push({ id: 'e4', source: 'operator1', target: 'operator2' });
      workflow.edges.push({ id: 'e5', source: 'operator2', target: 'result1' });
      
      const validation = executor.validateWorkflow(workflow);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Performance tests', () => {
    test('should handle deeply nested expressions efficiently', () => {
      const start = Date.now();
      const result = executor.executeExpression('((((1 + 2) * 3) + 4) * 5) + 6');
      const duration = Date.now() - start;
      
      // The expression evaluates to: ((((3) * 3) + 4) * 5) + 6 = (((9) + 4) * 5) + 6 = ((13) * 5) + 6 = 65 + 6 = 71
      expect(result).toBe(71);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should handle expressions with many operations', () => {
      const start = Date.now();
      const result = executor.executeExpression('1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10');
      const duration = Date.now() - start;
      
      expect(result).toBe(55);
      expect(duration).toBeLessThan(100);
    });

    test('should handle complex variable substitution efficiently', () => {
      const start = Date.now();
      const result = executor.executeExpression('a + b * c - d / e + f', {
        a: 10, b: 20, c: 30, d: 40, e: 5, f: 15
      });
      const duration = Date.now() - start;
      
      expect(result).toBe(617); // 10 + (20*30) - (40/5) + 15 = 10 + 600 - 8 + 15
      expect(duration).toBeLessThan(100);
    });
  });
});