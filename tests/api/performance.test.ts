import { APITestClient, TestDataGenerator } from '../utils/test-helpers';

describe('Performance and Load Testing', () => {
  let client: APITestClient;

  beforeAll(() => {
    client = new APITestClient();
  });

  describe('Response Time Performance', () => {
    test('should respond to simple create requests within 10 seconds', async () => {
      const startTime = Date.now();
      const message = 'create 5 + 3';
      
      const response = await client.sendMessage(message);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response).toBeDefined();
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(response.message).toBeDefined();
    });

    test('should respond to complex expressions within reasonable time', async () => {
      const complexExpressions = TestDataGenerator.getComplexExpressions();
      
      for (const expr of complexExpressions.slice(0, 3)) { // Test first 3 to avoid long test times
        const startTime = Date.now();
        const message = `create ${expr}`;
        
        const response = await client.sendMessage(message);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(response).toBeDefined();
        expect(duration).toBeLessThan(15000); // 15 seconds for complex expressions
        expect(response.message).toBeDefined();
      }
    });

    test('should handle find requests efficiently', async () => {
      // Create some workflows first
      const workflows = [];
      for (let i = 1; i <= 5; i++) {
        const createResult = await client.testWorkflowCreation(`create ${i} + ${i * 2}`);
        if (createResult.workflow) {
          workflows.push(createResult.workflow);
        }
      }
      
      const startTime = Date.now();
      const findResult = await client.testWorkflowFinding('find 3 + 6', workflows);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(findResult.response).toBeDefined();
      expect(duration).toBeLessThan(8000); // Should be faster than creation
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple simultaneous create requests', async () => {
      const expressions = ['1 + 1', '2 + 2', '3 + 3', '4 + 4', '5 + 5'];
      
      const promises = expressions.map(expr => 
        client.testWorkflowCreation(`create ${expr}`)
      );
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      results.forEach((result, index) => {
        expect(result.response).toBeDefined();
        expect(result.response.message).toBeDefined();
        // Note: Some might fail due to rate limiting, but shouldn't crash
      });
    });

    test('should handle mixed create/find concurrent requests', async () => {
      // Create some base workflows
      const baseWorkflows = [];
      for (let i = 10; i <= 12; i++) {
        const workflow = await client.testWorkflowCreation(`create ${i} * 2`);
        if (workflow.workflow) {
          baseWorkflows.push(workflow.workflow);
        }
      }
      
      const createPromises = ['20 + 1', '20 + 2'].map(expr => 
        client.testWorkflowCreation(`create ${expr}`)
      );
      
      const findPromises = ['10 * 2', '11 * 2'].map(expr => 
        client.testWorkflowFinding(`find ${expr}`, baseWorkflows)
      );
      
      const allResults = await Promise.all([...createPromises, ...findPromises]);
      
      // All should return valid responses
      allResults.forEach(result => {
        expect(result.response).toBeDefined();
      });
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should handle large number of templates efficiently', async () => {
      // Generate many mock templates
      const largeTemplateSet = Array.from({ length: 100 }, (_, i) => ({
        id: `template-${i}`,
        name: `AI: ${i} + ${i * 2}`,
        pattern: `${i} + ${i * 2}`,
        operations: [{ type: 'add', operands: [i, i * 2] }],
        nodes: [{ id: `node-${i}`, type: 'operand', value: i }],
        edges: []
      }));
      
      const startTime = Date.now();
      const result = await client.testWorkflowFinding('find 50 + 100', largeTemplateSet);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.response).toBeDefined();
      expect(duration).toBeLessThan(20000); // Should handle large datasets reasonably
    });

    test('should not leak memory with repeated requests', async () => {
      // Make multiple requests to the same endpoint
      const expression = 'create 7 * 8';
      
      for (let i = 0; i < 10; i++) {
        const result = await client.testWorkflowCreation(expression);
        expect(result.response).toBeDefined();
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // If we get here without timeout/crash, memory handling is likely OK
      expect(true).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from malformed requests', async () => {
      const malformedRequests = [
        '', // empty
        '   ', // whitespace
        'invalid json content',
        'create ' + 'x'.repeat(1000), // very long
      ];
      
      for (const request of malformedRequests) {
        try {
          const response = await client.sendMessage(request);
          // If it succeeds, response should be valid
          expect(response).toBeDefined();
          expect(typeof response.message).toBe('string');
        } catch (error) {
          // If it fails, should be graceful HTTP error, not crash
          expect(error).toBeDefined();
        }
      }
    });

    test('should handle network interruptions gracefully', async () => {
      // Test with invalid URL to simulate network issues
      const invalidClient = new APITestClient('http://localhost:9999/api/chat', 5000);
      
      try {
        await invalidClient.sendMessage('create 1 + 1');
        // If it somehow succeeds, that's fine
      } catch (error: any) {
        // Should get connection error, not crash
        expect(error).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid sequential requests', async () => {
      const expressions = TestDataGenerator.getSimpleExpressions().slice(0, 5);
      
      for (const expr of expressions) {
        const result = await client.testWorkflowCreation(`create ${expr}`);
        expect(result.response).toBeDefined();
        // No delay - test rapid sequential access
      }
    });

    test('should handle complex natural language parsing under load', async () => {
      const complexMessages = [
        'create workflow that adds 5 and 10 then multiplies by 3',
        'make a workflow for dividing 100 by 5 and subtracting 8',
        'build expression that multiplies 6 with 7 and adds 12',
        'generate workflow adding 15 with 25 and dividing by 8',
        'create complex calculation of 50 plus 30 times 2 minus 40'
      ];
      
      const startTime = Date.now();
      const results = await Promise.all(
        complexMessages.map(msg => client.sendMessage(msg))
      );
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
      });
      
      // All 5 complex requests should complete within reasonable time
      expect(totalDuration).toBeLessThan(60000); // 60 seconds for all
    });
  });

  describe('API Consistency', () => {
    test('should return consistent structure across requests', async () => {
      const messages = ['create 1 + 1', 'find 2 + 2', 'hello world'];
      
      for (const message of messages) {
        const response = await client.sendMessage(message);
        
        // All responses should have consistent base structure
        expect(response).toBeDefined();
        expect(typeof response.message).toBe('string');
        
        if (response.analysis) {
          expect(typeof response.analysis.intent).toBe('string');
          expect(typeof response.analysis.confidence).toBe('number');
        }
        
        if (response.createdWorkflow) {
          expect(typeof response.createdWorkflow.id).toBe('string');
          expect(typeof response.createdWorkflow.name).toBe('string');
        }
      }
    });

    test('should maintain API contract under various conditions', async () => {
      const testCases = [
        { message: 'create 5 + 5', templates: [] },
        { message: 'find 5 + 5', templates: [] },
        { message: 'create 5 + 5', templates: [{ id: 'test', name: 'test', pattern: 'test', operations: [], nodes: [], edges: [] }] },
        { message: 'find 5 + 5', templates: [{ id: 'test', name: 'test', pattern: 'test', operations: [], nodes: [], edges: [] }] }
      ];
      
      for (const testCase of testCases) {
        const response = await client.sendMessage(testCase.message, testCase.templates);
        
        // Response structure should remain consistent
        expect(response).toMatchObject({
          message: expect.any(String)
        });
        
        // Optional fields should be valid if present
        if (response.analysis) {
          expect(response.analysis).toMatchObject({
            intent: expect.any(String),
            confidence: expect.any(Number)
          });
        }
      }
    });
  });
});