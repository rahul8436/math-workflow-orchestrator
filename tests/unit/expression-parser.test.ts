import { ExpressionParser } from '../../src/lib/expression-parser';
import { OperationType } from '../../src/types/workflow';

describe('Expression Parser', () => {
  let parser: ExpressionParser;

  beforeEach(() => {
    parser = new ExpressionParser();
  });

  describe('parse', () => {
    describe('Basic parsing', () => {
      test('should parse simple addition', () => {
        const result = parser.parse('3 + 5');
        
        expect(result).toHaveProperty('tokens');
        expect(result).toHaveProperty('ast');
        expect(result).toHaveProperty('operations');
        expect(result.operations).toContain('addition');
      });

      test('should parse subtraction', () => {
        const result = parser.parse('10 - 4');
        
        expect(result.operations).toContain('subtraction');
      });

      test('should parse multiplication', () => {
        const result = parser.parse('6 * 7');
        
        expect(result.operations).toContain('multiplication');
      });

      test('should parse division', () => {
        const result = parser.parse('15 / 3');
        
        expect(result.operations).toContain('division');
      });
    });

    describe('Complex expressions', () => {
      test('should parse expression with multiple operators', () => {
        const result = parser.parse('2 + 3 * 4');
        
        expect(result.operations).toContain('addition');
        expect(result.operations).toContain('multiplication');
      });

      test('should parse expression with parentheses', () => {
        const result = parser.parse('(3 + 5) * 2');
        
        expect(result.operations).toContain('addition');
        expect(result.operations).toContain('multiplication');
      });

      test('should parse nested parentheses', () => {
        const result = parser.parse('((2 + 3) * 4) - 8');
        
        expect(result.operations.length).toBeGreaterThanOrEqual(3);
      });

      test('should parse complex expression with mixed operations', () => {
        const result = parser.parse('(3+5) - 4*(6+9)');
        
        expect(result.operations).toContain('addition');
        expect(result.operations).toContain('subtraction');
        expect(result.operations).toContain('multiplication');
      });
    });

    describe('Edge cases', () => {
      test('should parse negative numbers', () => {
        const result = parser.parse('-5 + 3');
        
        expect(result.tokens.length).toBeGreaterThan(0);
      });

      test('should parse decimal numbers', () => {
        const result = parser.parse('3.5 + 2.1');
        
        expect(result.tokens.length).toBeGreaterThan(0);
      });

      test('should handle whitespace', () => {
        const result = parser.parse('  3  +  5  ');
        
        expect(result.operations).toContain('addition');
      });

      test('should parse single number', () => {
        const result = parser.parse('42');
        
        expect(result.tokens.length).toBeGreaterThan(0);
        expect(result.operations).toHaveLength(0);
      });

      test('should handle zero', () => {
        const result = parser.parse('0 + 5');
        
        expect(result.operations).toContain('addition');
      });
    });

    describe('Variable expressions', () => {
      test('should parse variables in expression', () => {
        const result = parser.parse('a + b');
        
        expect(result).toHaveProperty('variables');
        expect(result.variables).toContain('a');
        expect(result.variables).toContain('b');
      });

      test('should parse mixed numbers and variables', () => {
        const result = parser.parse('a + 5');
        
        expect(result.variables).toContain('a');
      });

      test('should handle multi-character variable names', () => {
        const result = parser.parse('abc + def');
        
        expect(result.variables).toContain('abc');
        expect(result.variables).toContain('def');
      });
    });

    describe('Complexity calculation', () => {
      test('should calculate complexity for simple expressions', () => {
        const result = parser.parse('3 + 5');
        
        expect(result.complexity).toBeDefined();
        expect(typeof result.complexity).toBe('number');
        expect(result.complexity).toBeGreaterThanOrEqual(1);
      });

      test('should calculate higher complexity for nested expressions', () => {
        const simple = parser.parse('3 + 5');
        const complex = parser.parse('(3 + 5) * 2');
        
        expect(complex.complexity).toBeGreaterThanOrEqual(simple.complexity);
      });

      test('should calculate even higher complexity for deeply nested expressions', () => {
        const simple = parser.parse('3 + 5');
        const complex = parser.parse('((2 + 3) * 4) - 8 / (5 - 1)');
        
        expect(complex.complexity).toBeGreaterThanOrEqual(simple.complexity);
      });
    });
  });

  describe('Error handling', () => {
    test('should handle invalid expressions', () => {
      expect(() => parser.parse('3 +')).toThrow();
    });

    test('should handle unbalanced parentheses - missing closing', () => {
      expect(() => parser.parse('(3 + 5')).toThrow();
    });

    test('should handle empty expressions', () => {
      expect(() => parser.parse('')).toThrow();
    });

    test('should handle consecutive operators', () => {
      expect(() => parser.parse('3 ++ 5')).toThrow();
    });
  });

  describe('Integration tests', () => {
    test('should parse and extract all components', () => {
      const expression = '(3+5) - 4*(6+9)';
      
      const result = parser.parse(expression);
      
      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.ast).toBeDefined();
      expect(result.operations.length).toBeGreaterThan(0);
      expect(result.complexity).toBeDefined();
    });

    test('should handle complex real-world expressions', () => {
      const expression = '(a + b) / 2';  // Average calculation
      
      const result = parser.parse(expression);
      
      expect(result.variables).toContain('a');
      expect(result.variables).toContain('b');
      expect(result.operations).toContain('addition');
      expect(result.operations).toContain('division');
    });

    test('should parse financial formula', () => {
      const expression = 'p * (1 + r)';  // Simple interest
      
      const result = parser.parse(expression);
      
      expect(result.variables).toContain('p');
      expect(result.variables).toContain('r');
      expect(result.operations).toContain('multiplication');
      expect(result.operations).toContain('addition');
    });
  });

  describe('Performance tests', () => {
    test('should parse simple expressions quickly', () => {
      const start = Date.now();
      parser.parse('3 + 5');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('should parse complex expressions efficiently', () => {
      const start = Date.now();
      parser.parse('((((1 + 2) * 3) + 4) * 5) + 6');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle many operations efficiently', () => {
      const longExpr = Array.from({ length: 20 }, (_, i) => i).join(' + ');
      const start = Date.now();
      parser.parse(longExpr);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });
});
