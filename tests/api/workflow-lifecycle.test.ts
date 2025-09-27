import { APITestClient, isValidWorkflow, TestDataGenerator } from '../utils/test-helpers';

describe('Workflow Lifecycle', () => {
  let client: APITestClient;
  const createdWorkflows: any[] = [];

  beforeAll(() => {
    client = new APITestClient();
  });

  afterAll(async () => {
    // Clean up any created workflows if needed
    // This depends on your API supporting cleanup
  });

  describe('Workflow Creation', () => {
    test('should create simple arithmetic workflow', async () => {
      const message = 'create 5 + 3';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const workflow = result.workflow;
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toContain('5');
      expect(workflow.name).toContain('3');
      expect(workflow.pattern).toMatch(/5.*\+.*3|5.*3/);
      expect(workflow.operations.length).toBeGreaterThan(0);
      expect(workflow.nodes.length).toBeGreaterThan(0);
      expect(workflow.edges.length).toBeGreaterThan(0);
      
      createdWorkflows.push(workflow);
    });

    test('should create complex expression workflow', async () => {
      const message = 'create (12 + 8) * 3 - 15';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const workflow = result.workflow;
      expect(workflow.pattern).toContain('12');
      expect(workflow.pattern).toContain('8');
      expect(workflow.pattern).toContain('3');
      expect(workflow.pattern).toContain('15');
      expect(workflow.operations.length).toBeGreaterThanOrEqual(3); // +, *, -
      
      createdWorkflows.push(workflow);
    });

    test('should create workflow from natural language', async () => {
      const message = 'create workflow adding 4 with 6 with 8 with 9 and divide them by 10 and multiply with 7';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const workflow = result.workflow;
      expect(workflow.pattern).toContain('4');
      expect(workflow.pattern).toContain('6');
      expect(workflow.pattern).toContain('8');
      expect(workflow.pattern).toContain('9');
      expect(workflow.pattern).toContain('10');
      expect(workflow.pattern).toContain('7');
      
      createdWorkflows.push(workflow);
    });

    test('should handle user-specific test case: "50 + 80 /60"', async () => {
      const message = 'create 50 + 80 /60';
      const result = await client.testWorkflowCreation(message);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(isValidWorkflow(result.workflow)).toBe(true);
      
      const workflow = result.workflow;
      expect(workflow.pattern).toContain('50');
      expect(workflow.pattern).toContain('80');
      expect(workflow.pattern).toContain('60');
      expect(workflow.name).toContain('50');
      expect(workflow.name).toContain('80');
      expect(workflow.name).toContain('60');
      
      createdWorkflows.push(workflow);
    });
  });

  describe('Workflow Finding', () => {
    test('should find recently created workflow', async () => {
      // First create a workflow
      const createMessage = 'create 15 * 2 + 8';
      const createResult = await client.testWorkflowCreation(createMessage);
      expect(createResult.success).toBe(true);
      
      const createdWorkflow = createResult.workflow;
      createdWorkflows.push(createdWorkflow);
      
      // Then try to find it
      const findMessage = 'find 15 * 2 + 8';
      const findResult = await client.testWorkflowFinding(findMessage, createdWorkflows);
      
      expect(findResult.success).toBe(true);
      expect(findResult.found || findResult.suggestions.length > 0).toBe(true);
      
      if (findResult.found) {
        expect(findResult.found.id).toBe(createdWorkflow.id);
      } else if (findResult.suggestions.length > 0) {
        const foundSuggestion = findResult.suggestions.find(s => s.id === createdWorkflow.id);
        expect(foundSuggestion).toBeDefined();
      }
    });

    test('should find workflow with different expression format', async () => {
      // Create with one format
      const createMessage = 'create 10 / 2';
      const createResult = await client.testWorkflowCreation(createMessage);
      expect(createResult.success).toBe(true);
      
      const createdWorkflow = createResult.workflow;
      createdWorkflows.push(createdWorkflow);
      
      // Find with similar but different format
      const findMessage = 'find 10 divided by 2';
      const findResult = await client.testWorkflowFinding(findMessage, createdWorkflows);
      
      expect(findResult.success).toBe(true);
      // Should find as suggestion even if not exact match
      expect(findResult.found || findResult.suggestions.length > 0).toBe(true);
    });

    test('should return suggestions when exact match not found', async () => {
      const findMessage = 'find some non-existent workflow 999 + 888';
      const findResult = await client.testWorkflowFinding(findMessage, createdWorkflows);
      
      // Even if no exact match, should return related suggestions or handle gracefully
      expect(findResult.response.message).toBeDefined();
      expect(typeof findResult.response.message).toBe('string');
    });
  });

  describe('End-to-End Workflow Lifecycle', () => {
    test('complete create-then-find cycle', async () => {
      const expression = '25 * 4 - 10';
      
      // Step 1: Create workflow
      const createMessage = `create ${expression}`;
      const createResult = await client.testWorkflowCreation(createMessage);
      
      expect(createResult.success).toBe(true);
      expect(createResult.workflow).toBeDefined();
      expect(isValidWorkflow(createResult.workflow)).toBe(true);
      
      const workflow = createResult.workflow;
      createdWorkflows.push(workflow);
      
      // Step 2: Find the same workflow
      const findMessage = `find ${expression}`;
      const findResult = await client.testWorkflowFinding(findMessage, createdWorkflows);
      
      expect(findResult.success).toBe(true);
      
      // Step 3: Verify found workflow matches created workflow
      if (findResult.found) {
        expect(findResult.found.id).toBe(workflow.id);
        expect(findResult.found.pattern).toBe(workflow.pattern);
      } else {
        // Should at least find it in suggestions
        const suggestion = findResult.suggestions.find(s => s.id === workflow.id);
        expect(suggestion).toBeDefined();
      }
    });

    test('should handle multiple similar workflows', async () => {
      // Create multiple similar workflows
      const expressions = ['20 + 5', '20 + 6', '20 + 7'];
      const workflows: any[] = [];
      
      for (const expr of expressions) {
        const createResult = await client.testWorkflowCreation(`create ${expr}`);
        expect(createResult.success).toBe(true);
        workflows.push(createResult.workflow);
        createdWorkflows.push(createResult.workflow);
      }
      
      // Search for one of them
      const findResult = await client.testWorkflowFinding('find 20 + 5', createdWorkflows);
      
      expect(findResult.success).toBe(true);
      // Should find the exact match or include it in suggestions
      if (findResult.found) {
        expect(findResult.found.pattern).toContain('20');
        expect(findResult.found.pattern).toContain('5');
      } else {
        expect(findResult.suggestions.some(s => s.pattern.includes('20') && s.pattern.includes('5'))).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed expressions gracefully', async () => {
      const malformedExpressions = [
        'create ((((5 + 3',
        'create 5 + + 3',
        'create / * - +',
        'create 5 +',
        'create + 3'
      ];
      
      for (const expr of malformedExpressions) {
        const response = await client.sendMessage(expr);
        
        // Should not crash and should provide meaningful response
        expect(response).toBeDefined();
        expect(typeof response.message).toBe('string');
        expect(response.message.length).toBeGreaterThan(0);
        
        // If workflow is created, it should still be valid
        if (response.createdWorkflow) {
          expect(isValidWorkflow(response.createdWorkflow)).toBe(true);
        }
      }
    });

    test('should handle API timeout gracefully', async () => {
      // Create client with very short timeout
      const shortTimeoutClient = new APITestClient('http://localhost:3001/api/chat', 100);
      
      try {
        const response = await shortTimeoutClient.sendMessage('create very complex expression that might take time');
        // If it doesn't timeout, that's fine too
        expect(response).toBeDefined();
      } catch (error: any) {
        // Should be a timeout error, not a crash
        expect(error.name).toContain('Timeout');
      }
    });

    test('should handle empty workflow templates array', async () => {
      const message = 'find 5 + 3';
      const result = await client.testWorkflowFinding(message, []);
      
      // Should handle empty templates gracefully
      expect(result.response).toBeDefined();
      expect(typeof result.response.message).toBe('string');
    });
  });
});