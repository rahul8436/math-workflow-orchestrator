import { WorkflowMatcher } from '../../src/lib/workflow-matcher';
import { WorkflowTemplate } from '../../src/types/workflow';

describe('WorkflowMatcher', () => {
  let matcher: WorkflowMatcher;
  let templates: WorkflowTemplate[];

  beforeEach(() => {
    // Create test templates
    templates = [
      {
        id: 'simple-addition',
        name: 'Simple Addition',
        description: 'Add two numbers',
        pattern: 'a + b',
        complexity: 'basic',
        operations: ['addition'],
        operandCount: 2,
        nodes: [
          {
            id: 'operand1',
            type: 'operand',
            position: { x: 0, y: 0 },
            data: { value: 0 }
          },
          {
            id: 'operand2',
            type: 'operand',
            position: { x: 100, y: 0 },
            data: { value: 0 }
          },
          {
            id: 'operator1',
            type: 'operator',
            position: { x: 50, y: 100 },
            data: { operation: 'addition' }
          },
          {
            id: 'result1',
            type: 'result',
            position: { x: 50, y: 200 },
            data: {}
          }
        ],
        edges: [
          { id: 'e1', source: 'operand1', target: 'operator1' },
          { id: 'e2', source: 'operand2', target: 'operator1' },
          { id: 'e3', source: 'operator1', target: 'result1' }
        ],
        tags: ['arithmetic', 'basic'],
        examples: ['3 + 5', '10 + 20'],
        createdAt: new Date(),
        usageCount: 5
      },
      {
        id: 'complex-expression',
        name: 'Complex Expression',
        description: 'Complex mathematical expression with parentheses',
        pattern: '(a+b) - c*(d+e)',
        complexity: 'advanced',
        operations: ['addition', 'subtraction', 'multiplication'],
        operandCount: 5,
        nodes: [
          {
            id: 'operand1',
            type: 'operand',
            position: { x: 0, y: 0 },
            data: { value: 3 }
          },
          {
            id: 'operand2',
            type: 'operand',
            position: { x: 100, y: 0 },
            data: { value: 5 }
          },
          {
            id: 'operand3',
            type: 'operand',
            position: { x: 200, y: 0 },
            data: { value: 4 }
          },
          {
            id: 'operand4',
            type: 'operand',
            position: { x: 300, y: 0 },
            data: { value: 6 }
          },
          {
            id: 'operand5',
            type: 'operand',
            position: { x: 400, y: 0 },
            data: { value: 9 }
          },
          {
            id: 'result1',
            type: 'result',
            position: { x: 200, y: 300 },
            data: {}
          }
        ],
        edges: [],
        tags: ['arithmetic', 'advanced', 'parentheses'],
        examples: ['(3+5) - 4*(6+9)', '(8+12) - 2*(3+7)'],
        exactValues: [3, 5, 4, 6, 9],
        exactExpression: '(3+5) - 4*(6+9)',
        createdAt: new Date(),
        usageCount: 2
      },
      {
        id: 'partial-match',
        name: 'Partial Match',
        description: 'Partial expression template',
        pattern: 'a + b - c',
        complexity: 'intermediate',
        operations: ['addition', 'subtraction'],
        operandCount: 3,
        nodes: [],
        edges: [],
        tags: ['arithmetic'],
        examples: ['5 + 3 - 2'],
        createdAt: new Date(),
        usageCount: 1
      }
    ];
    
    matcher = new WorkflowMatcher(templates);
  });

  describe('findMatches', () => {
    test('should find matches for exact expressions', () => {
      const matches = matcher.findMatches('(3+5) - 4*(6+9)');
      
      expect(matches.length).toBeGreaterThan(0);
      // Should find the complex expression match
      const complexMatch = matches.find(m => m.workflowId === 'complex-expression');
      expect(complexMatch).toBeDefined();
      expect(complexMatch!.confidence).toBeGreaterThan(0.9);
    });

    test('should handle simple expressions', () => {
      const matches = matcher.findMatches('3 + 5');
      
      expect(matches.length).toBeGreaterThan(0);
      const additionMatch = matches.find(m => m.workflowId === 'simple-addition');
      expect(additionMatch).toBeDefined();
    });

    test('should handle natural language', () => {
      const matches = matcher.findMatches('add 3 and 5');
      
      expect(matches.length).toBeGreaterThan(0);
      const additionMatch = matches.find(m => m.workflowId === 'simple-addition');
      expect(additionMatch).toBeDefined();
    });

    test('should handle unsupported operations gracefully', () => {
      const matches = matcher.findMatches('sin(x) + cos(y)');
      
      // May still find partial matches based on operations like addition
      expect(matches.length).toBeGreaterThanOrEqual(0);
      if (matches.length > 0) {
        // If matches found, they should have reasonable confidence
        matches.forEach(match => {
          expect(match.confidence).toBeGreaterThan(0);
          expect(match.confidence).toBeLessThanOrEqual(1);
        });
      }
    });
  });

  describe('workflow template management', () => {
    test('should set new templates', () => {
      const newTemplates = [templates[0]]; // Only simple addition
      matcher.setTemplates(newTemplates);
      
      const matches = matcher.findMatches('3 + 5');
      expect(matches.length).toBeGreaterThan(0);
      
      // Should not find complex expression anymore
      const complexMatch = matches.find(m => m.workflowId === 'complex-expression');
      expect(complexMatch).toBeUndefined();
    });

    test('should handle empty templates', () => {
      matcher.setTemplates([]);
      
      const matches = matcher.findMatches('3 + 5');
      expect(matches).toHaveLength(0);
    });
  });

  describe('input validation', () => {
    test('should handle different input formats consistently', () => {
      const matches1 = matcher.findMatches('3 + 5');
      const matches2 = matcher.findMatches('3+5');
      const matches3 = matcher.findMatches('  3  +  5  ');
      
      // All should find matches
      expect(matches1.length).toBeGreaterThan(0);
      expect(matches2.length).toBeGreaterThan(0);
      expect(matches3.length).toBeGreaterThan(0);
      
      // Should find addition matches in all cases
      expect(matches1.some(m => m.workflowId === 'simple-addition')).toBe(true);
      expect(matches2.some(m => m.workflowId === 'simple-addition')).toBe(true);
      expect(matches3.some(m => m.workflowId === 'simple-addition')).toBe(true);
    });

    test('should handle empty input', () => {
      const matches = matcher.findMatches('');
      expect(matches).toHaveLength(0);
    });

    test('should handle whitespace-only input', () => {
      const matches = matcher.findMatches('   ');
      expect(matches).toHaveLength(0);
    });
  });

  describe('confidence scoring', () => {
    test('should provide confidence scores', () => {
      const matches = matcher.findMatches('3 + 5');
      
      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(match => {
        expect(match.confidence).toBeGreaterThanOrEqual(0);
        expect(match.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should sort by confidence', () => {
      const matches = matcher.findMatches('(3+5) - 4*(6+9)');
      
      expect(matches.length).toBeGreaterThan(1);
      
      // Check that matches are sorted by confidence (descending)
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
      }
    });
  });
});