import { POST } from '../../src/app/api/chat/route';
import { NextRequest } from 'next/server';
import { workflowExecutor } from '../../src/lib/workflow-executor';

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

const createRequest = (body: any): NextRequest => {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

// Run these tests only if GROQ_API_KEY is set
describeIf(!!process.env.GROQ_API_KEY)('End-to-End Workflow Lifecycle', () => {
  
  describe('Complete Workflow Creation and Execution', () => {
    test('should create and execute simple addition workflow', async () => {
      // Step 1: Create workflow
      const createRequest1 = createRequest({
        message: 'Create workflow for 5 + 3'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      expect(createData.message).toBeDefined();
      
      // If a workflow was created, verify its structure
      if (createData.createdWorkflow) {
        expect(createData.createdWorkflow).toHaveProperty('id');
        expect(createData.createdWorkflow).toHaveProperty('pattern');
        expect(createData.createdWorkflow).toHaveProperty('nodes');
        expect(createData.createdWorkflow).toHaveProperty('edges');
        
        // Step 2: Execute the workflow
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(8);
      }
    }, 30000);

    test('should create and execute complex expression workflow', async () => {
      // Create: (3 + 5) - 4 * (6 + 9) = -52
      const createRequest1 = createRequest({
        message: 'Create workflow for (3+5) - 4*(6+9)'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        expect(createData.createdWorkflow.operations).toContain('addition');
        expect(createData.createdWorkflow.operations).toContain('subtraction');
        expect(createData.createdWorkflow.operations).toContain('multiplication');
        
        // Execute
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(-52);
      }
    }, 30000);

    test('should create and execute multiplication/division workflow', async () => {
      // Create: 24 / 6 * 2 = 8
      const createRequest1 = createRequest({
        message: 'Create workflow for 24 / 6 * 2'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        // Execute
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(8);
      }
    }, 30000);
  });

  describe('Edge Cases - Creation and Execution', () => {
    test('should handle nested parentheses workflow', async () => {
      // ((((1 + 2) * 3) + 4) * 5) = 65
      const createRequest1 = createRequest({
        message: 'Create workflow for ((((1 + 2) * 3) + 4) * 5)'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(65);
      }
    }, 30000);

    test('should handle large numbers workflow', async () => {
      // 999999999 + 999999999 = 1999999998
      const createRequest1 = createRequest({
        message: 'Create workflow for 999999999 + 999999999'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(1999999998);
      }
    }, 30000);

    test('should handle negative numbers workflow', async () => {
      // -5 + 3 = -2
      const createRequest1 = createRequest({
        message: 'Create workflow for -5 + 3'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(-2);
      }
    }, 30000);

    test('should handle decimal numbers workflow', async () => {
      // 0.1 + 0.2 (floating point precision)
      const createRequest1 = createRequest({
        message: 'Create workflow for 0.1 + 0.2'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        // Allow for floating point precision
        expect(result.result).toBeCloseTo(0.3, 5);
      }
    }, 30000);

    test('should handle division by zero workflow', async () => {
      // 10 / 0 - should throw error or return Infinity
      const createRequest1 = createRequest({
        message: 'Create workflow for 10 / 0'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        // Division by zero should either throw an error or return Infinity
        try {
          const result = workflowExecutor.execute(createData.createdWorkflow, {});
          expect(result).toBeDefined();
          // If it doesn't throw, it should return Infinity
          expect([Infinity, -Infinity]).toContain(result.result);
        } catch (error) {
          // It's acceptable to throw an error for division by zero
          expect(error.message).toContain('Division by zero');
        }
      }
    }, 30000);

    test('should handle operator precedence workflow', async () => {
      // 2 + 3 * 4 = 14 (not 20)
      const createRequest1 = createRequest({
        message: 'Create workflow for 2 + 3 * 4'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(14);
      }
    }, 30000);

    test('should handle mixed operators workflow', async () => {
      // 10 - 5 + 3 * 2 = 11
      const createRequest1 = createRequest({
        message: 'Create workflow for 10 - 5 + 3 * 2'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(11);
      }
    }, 30000);

    test('should handle sequential operations workflow', async () => {
      // 100 / 10 / 2 = 5 (left-to-right evaluation)
      const createRequest1 = createRequest({
        message: 'Create workflow for 100 / 10 / 2'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      
      if (createData.createdWorkflow) {
        const result = workflowExecutor.execute(createData.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(5);
      }
    }, 30000);
  });

  describe('Workflow Finding After Creation', () => {
    test('should create workflow then find similar patterns', async () => {
      // Create a workflow
      const createRequest1 = createRequest({
        message: 'Create workflow for 7 + 8'
      });

      const createResponse = await POST(createRequest1);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);

      // Now try to find workflows with addition
      const findRequest = createRequest({
        message: 'Find workflow for addition',
        templates: createData.createdWorkflow ? [createData.createdWorkflow] : []
      });

      const findResponse = await POST(findRequest);
      const findData = await findResponse.json();

      expect(findResponse.status).toBe(200);
      expect(findData.message).toBeDefined();
    }, 60000);

    test('should create multiple workflows and find the right one', async () => {
      const workflows = [];

      // Create workflow 1: Addition
      const create1 = await POST(createRequest({ message: 'Create workflow for 5 + 3' }));
      const data1 = await create1.json();
      if (data1.createdWorkflow) workflows.push(data1.createdWorkflow);

      // Create workflow 2: Multiplication
      const create2 = await POST(createRequest({ message: 'Create workflow for 6 * 7' }));
      const data2 = await create2.json();
      if (data2.createdWorkflow) workflows.push(data2.createdWorkflow);

      // Create workflow 3: Division
      const create3 = await POST(createRequest({ message: 'Create workflow for 20 / 4' }));
      const data3 = await create3.json();
      if (data3.createdWorkflow) workflows.push(data3.createdWorkflow);

      expect(workflows.length).toBeGreaterThan(0);

      // Find multiplication workflow
      const findRequest = createRequest({
        message: 'Find workflow for multiplication',
        templates: workflows
      });

      const findResponse = await POST(findRequest);
      const findData = await findResponse.json();

      expect(findResponse.status).toBe(200);
      expect(findData.message).toBeDefined();
    }, 90000);
  });

  describe('Error Handling in Workflows', () => {
    test('should handle invalid expression gracefully', async () => {
      const request = createRequest({
        message: 'Create workflow for 5 + '
      });

      const response = await POST(request);
      const data = await response.json();

      // Should not crash, should provide response
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    }, 30000);

    test('should handle non-mathematical input', async () => {
      const request = createRequest({
        message: 'Create workflow for hello world'
      });

      const response = await POST(request);
      const data = await response.json();

      // Should not crash
      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    }, 30000);

    test('should handle empty message', async () => {
      const request = createRequest({
        message: ''
      });

      const response = await POST(request);

      // Should handle gracefully
      expect(response.status).toBe(200);
    }, 30000);
  });

  describe('Performance and Concurrency', () => {
    test('should handle concurrent workflow creation', async () => {
      const requests = [
        createRequest({ message: 'Create workflow for 1 + 1' }),
        createRequest({ message: 'Create workflow for 2 + 2' }),
        createRequest({ message: 'Create workflow for 3 + 3' }),
      ];

      const responses = await Promise.all(requests.map(req => POST(req)));
      
      for (const response of responses) {
        expect(response.status).toBeLessThan(500);
        const data = await response.json();
        expect(data.message).toBeDefined();
      }
    }, 60000);

    test('should handle rapid sequential requests', async () => {
      const expressions = ['5 + 5', '10 * 2', '20 / 4', '15 - 5'];
      
      for (const expr of expressions) {
        const request = createRequest({ message: `Create workflow for ${expr}` });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBeDefined();
      }
    }, 90000);
  });

  describe('Workflow Complexity Levels', () => {
    test('should handle basic complexity workflow', async () => {
      const request = createRequest({
        message: 'Create workflow for 1 + 1'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        expect(data.createdWorkflow.complexity).toBe('basic');
      }
    }, 30000);

    test('should handle intermediate complexity workflow', async () => {
      const request = createRequest({
        message: 'Create workflow for 5 + 3 * 2'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        expect(['intermediate', 'advanced']).toContain(data.createdWorkflow.complexity);
      }
    }, 60000);

    test('should handle advanced complexity workflow', async () => {
      const request = createRequest({
        message: 'Create workflow for (5 + 3) * (2 - 1) / 4'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        expect(['intermediate', 'advanced', 'complex']).toContain(data.createdWorkflow.complexity);
      }
    }, 60000);
  });

  describe('Real-world Mathematical Scenarios', () => {
    test('should handle percentage calculation workflow', async () => {
      // 20% of 100: (20 / 100) * 100 = 20
      const request = createRequest({
        message: 'Create workflow for 20 / 100 * 100'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        const result = workflowExecutor.execute(data.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(20);
      }
    }, 30000);

    test('should handle area calculation workflow', async () => {
      // Area of rectangle: 10 * 5 = 50
      const request = createRequest({
        message: 'Create workflow for 10 * 5'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        const result = workflowExecutor.execute(data.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(50);
      }
    }, 30000);

    test('should handle average calculation workflow', async () => {
      // Average of 10, 20, 30: (10 + 20 + 30) / 3 = 20
      const request = createRequest({
        message: 'Create workflow for (10 + 20 + 30) / 3'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      if (data.createdWorkflow) {
        const result = workflowExecutor.execute(data.createdWorkflow, {});
        expect(result).toBeDefined();
        expect(result.result).toBe(20);
      }
    }, 30000);
  });
});
