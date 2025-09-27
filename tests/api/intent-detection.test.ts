import { APITestClient, isValidWorkflow, isValidExpression, isValidIntent, TestDataGenerator } from '../utils/test-helpers';

describe('Intent Detection', () => {
  let client: APITestClient;

  beforeAll(() => {
    client = new APITestClient();
  });

  describe('CREATE Intent Detection', () => {
    const createMessages = TestDataGenerator.getCreateMessages();

    test.each(createMessages)('should detect CREATE intent for: "%s"', async (message) => {
      const result = await client.testIntentDetection(message, 'create_workflow');
      
      expect(result.success).toBe(true);
      expect(result.actualIntent).toBe('create_workflow');
      expect(result.response.analysis?.confidence).toBeGreaterThan(0.5);
    });

    test('should prioritize CREATE over FIND when both keywords present', async () => {
      const message = 'create and find 5 + 3';
      const result = await client.testIntentDetection(message, 'create_workflow');
      
      expect(result.success).toBe(true);
      expect(result.actualIntent).toBe('create_workflow');
    });

    test('should handle case-insensitive CREATE', async () => {
      const variations = ['CREATE 5 + 3', 'Create 5 + 3', 'cReAtE 5 + 3'];
      
      for (const message of variations) {
        const result = await client.testIntentDetection(message, 'create_workflow');
        expect(result.success).toBe(true);
      }
    });
  });

  describe('FIND Intent Detection', () => {
    const findMessages = TestDataGenerator.getFindMessages();

    test.each(findMessages)('should detect FIND intent for: "%s"', async (message) => {
      const result = await client.testIntentDetection(message, 'find_workflow');
      
      expect(result.success).toBe(true);
      expect(result.actualIntent).toBe('find_workflow');
      expect(result.response.analysis?.confidence).toBeGreaterThan(0.5);
    });

    test('should handle case-insensitive FIND', async () => {
      const variations = ['FIND 5 + 3', 'Find 5 + 3', 'fInD 5 + 3'];
      
      for (const message of variations) {
        const result = await client.testIntentDetection(message, 'find_workflow');
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    const edgeCases = TestDataGenerator.getEdgeCases();

    test.each(edgeCases)('$description', async ({ message, expectedIntent, description }) => {
      if (expectedIntent) {
        const result = await client.testIntentDetection(message, expectedIntent);
        expect(result.actualIntent).toBe(expectedIntent);
        expect(isValidIntent(result.actualIntent)).toBe(true);
      } else {
        // Just verify we get some valid intent
        const response = await client.sendMessage(message);
        const actualIntent = response.analysis?.intent || 'general';
        expect(isValidIntent(actualIntent)).toBe(true);
      }
    });
  });

  describe('Invalid Inputs', () => {
    const invalidInputs = TestDataGenerator.getInvalidInputs();

    test.each(invalidInputs)('should handle gracefully: $description', async ({ message }) => {
      const response = await client.sendMessage(message);
      
      // Should not crash and should return valid response structure
      expect(response).toBeDefined();
      expect(typeof response.message).toBe('string');
      
      if (response.analysis?.intent) {
        expect(isValidIntent(response.analysis.intent)).toBe(true);
      }
    });
  });
});

describe('Expression Extraction', () => {
  let client: APITestClient;

  beforeAll(() => {
    client = new APITestClient();
  });

  describe('Simple Expressions', () => {
    const simpleExpressions = TestDataGenerator.getSimpleExpressions();

    test.each(simpleExpressions)('should extract expression from "create %s"', async (expression) => {
      const message = `create ${expression}`;
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      // Check if extracted expression is valid
      const extractedPattern = result.workflow.pattern;
      expect(isValidExpression(extractedPattern)).toBe(true);
    });
  });

  describe('Complex Expressions', () => {
    const complexExpressions = TestDataGenerator.getComplexExpressions();

    test.each(complexExpressions)('should extract complex expression from "create %s"', async (expression) => {
      const message = `create ${expression}`;
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const extractedPattern = result.workflow.pattern;
      expect(isValidExpression(extractedPattern)).toBe(true);
      expect(extractedPattern.length).toBeGreaterThan(5); // Complex expressions should be longer
    });
  });

  describe('Natural Language Expressions', () => {
    test('should extract from "adding 4 with 6 with 8 with 9 and divide them by 10 and multiply with 7"', async () => {
      const message = 'create workflow adding 4 with 6 with 8 with 9 and divide them by 10 and multiply with 7';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const extractedPattern = result.workflow.pattern;
      expect(extractedPattern).toContain('4');
      expect(extractedPattern).toContain('6');
      expect(extractedPattern).toContain('8');
      expect(extractedPattern).toContain('9');
      expect(extractedPattern).toContain('10');
      expect(extractedPattern).toContain('7');
    });

    test('should extract from "multiply 7 with 8 and add 3"', async () => {
      const message = 'create workflow that multiplies 7 with 8 and adds 3';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      
      const extractedPattern = result.workflow.pattern;
      expect(extractedPattern).toContain('7');
      expect(extractedPattern).toContain('8');
      expect(extractedPattern).toContain('3');
    });
  });

  describe('Expression Validation', () => {
    test('should reject overly verbose expressions', async () => {
      const verboseMessage = 'create a workflow that step by step first adds 5 and 3 then multiplies the result by 2';
      const result = await client.testWorkflowCreation(verboseMessage);
      
      if (result.success && result.workflow) {
        // If workflow is created, pattern should be clean mathematical expression
        const pattern = result.workflow.pattern;
        expect(pattern).not.toContain('step by step');
        expect(pattern).not.toContain('first');
        expect(pattern).not.toContain('then');
        expect(pattern.length).toBeLessThan(100); // Should be concise
      }
    });

    test('should handle parentheses correctly', async () => {
      const message = 'create (5 + 3) * (8 - 2)';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      
      const pattern = result.workflow.pattern;
      expect(pattern).toContain('(');
      expect(pattern).toContain(')');
      
      // Count parentheses should be balanced
      const openCount = (pattern.match(/\(/g) || []).length;
      const closeCount = (pattern.match(/\)/g) || []).length;
      expect(openCount).toBe(closeCount);
    });
  });
});

describe('Response Validation', () => {
  let client: APITestClient;

  beforeAll(() => {
    client = new APITestClient();
  });

  test('should return concise responses for workflow creation', async () => {
    const message = 'create 5 + 3';
    const response = await client.sendMessage(message);
    
    expect(response.message).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeLessThan(500); // Should be concise
    expect(response.message).not.toContain('step by step');
    expect(response.message).not.toContain('first');
    expect(response.message).not.toContain('then');
    expect(response.message).not.toContain('next');
  });

  test('should provide analysis metadata', async () => {
    const message = 'create 10 * 2';
    const response = await client.sendMessage(message);
    
    expect(response.analysis).toBeDefined();
    expect(response.analysis?.intent).toBe('create_workflow');
    expect(typeof response.analysis?.confidence).toBe('number');
    expect(response.analysis?.confidence).toBeGreaterThan(0);
    expect(response.analysis?.confidence).toBeLessThanOrEqual(1);
    expect(typeof response.analysis?.reasoning).toBe('string');
  });

  test('should include orchestration metadata', async () => {
    const message = 'create 15 / 3';
    const response = await client.sendMessage(message);
    
    if (response.orchestration) {
      expect(typeof response.orchestration).toBe('object');
      // Add specific orchestration validation based on your implementation
    }
  });
});