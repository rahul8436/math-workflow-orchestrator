// Mock fetch for tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test utilities
export interface APITestResponse {
  message: string;
  analysis?: {
    intent: string;
    expression?: string;
    extractedNumbers: number[];
    extractedOperations: string[];
    variables: string[];
    confidence: number;
    suggestedAction: string;
    reasoning?: string;
  };
  orchestration?: {
    intent: string;
    confidence: number;
    reasoning: string;
    suggestedActions: any[];
    alternativeOptions: string[];
  };
  workflowSuggestions?: any[];
  createdWorkflow?: string;
  createdWorkflowName?: string;
  foundWorkflow?: any;
  suggestions?: any[];
}

export class APITestClient {
  private baseUrl = 'http://localhost:3000';

  async sendMessage(message: string): Promise<APITestResponse> {
    // Mock the response based on the message content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => this.generateMockResponse(message)
    });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private generateMockResponse(message: string): APITestResponse {
    const lowerMessage = message.toLowerCase();
    
    // Extract numbers from message
    const numbers = message.match(/\d+(\.\d+)?/g)?.map(Number) || [];
    
    // Extract operations
    const operations = [];
    if (lowerMessage.includes('+') || lowerMessage.includes('add')) operations.push('addition');
    if (lowerMessage.includes('-') || lowerMessage.includes('subtract')) operations.push('subtraction');
    if (lowerMessage.includes('*') || lowerMessage.includes('multiply')) operations.push('multiplication');
    if (lowerMessage.includes('/') || lowerMessage.includes('divide')) operations.push('division');

    // Determine intent
    let intent = 'general';
    if (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('generate')) {
      intent = 'create_workflow';
    } else if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('get') || lowerMessage.includes('show') || lowerMessage.includes('locate') || lowerMessage.includes('which')) {
      intent = 'find_workflow';
    }

    // Extract expression
    const expression = this.extractExpression(message);

    return {
      message: intent === 'create_workflow' ? 
        `Created workflow for ${expression || message}` : 
        `Found workflow suggestions for ${expression || message}`,
      analysis: {
        intent,
        expression,
        extractedNumbers: numbers,
        extractedOperations: operations,
        variables: [],
        confidence: 0.9,
        suggestedAction: intent === 'create_workflow' ? 'create' : 'find',
        reasoning: `Detected ${intent} intent from message`
      },
      orchestration: {
        intent: intent === 'create_workflow' ? 'create' : 'find',
        confidence: 0.9,
        reasoning: `Detected ${intent} intent from message`,
        suggestedActions: [],
        alternativeOptions: []
      },
      workflowSuggestions: intent === 'find_workflow' ? [
        {
          workflowId: 'test-workflow',
          name: 'Test Workflow',
          confidence: 0.8,
          reason: 'Mock workflow match',
          matchType: 'partial'
        }
      ] : undefined,
      createdWorkflow: intent === 'create_workflow' ? 'new-workflow-id' : undefined,
      createdWorkflowName: intent === 'create_workflow' ? 'New Workflow' : undefined
    };
  }

  private extractExpression(message: string): string | undefined {
    // Simple regex to extract mathematical expressions
    const mathPattern = /(\d+(?:\.\d+)?\s*[+\-*/]\s*\d+(?:\.\d+)?(?:\s*[+\-*/]\s*\d+(?:\.\d+)?)*|\(\s*\d+(?:\.\d+)?\s*[+\-*/]\s*\d+(?:\.\d+)?\s*\)(?:\s*[+\-*/]\s*\d+(?:\.\d+)?)*)/g;
    const matches = message.match(mathPattern);
    return matches ? matches[0] : undefined;
  }

  async testIntentDetection(message: string): Promise<{ intent: string; confidence: number }> {
    const response = await this.sendMessage(message);
    return {
      intent: response.analysis?.intent || 'general',
      confidence: response.analysis?.confidence || 0
    };
  }

  async testWorkflowCreation(message: string): Promise<{ expression: string; success: boolean }> {
    const response = await this.sendMessage(message);
    return {
      expression: response.analysis?.expression || '',
      success: !!response.createdWorkflow
    };
  }
}

export const apiTestClient = new APITestClient();

// Performance testing utilities
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
}

export class PerformanceTestRunner {
  private metrics: PerformanceMetrics[] = [];

  async runPerformanceTest(
    testFunction: () => Promise<any>,
    iterations: number = 100
  ): Promise<PerformanceMetrics> {
    const results = [];
    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      const iterationStart = process.hrtime.bigint();
      try {
        await testFunction();
        const iterationEnd = process.hrtime.bigint();
        results.push({
          success: true,
          duration: Number(iterationEnd - iterationStart) / 1000000 // Convert to ms
        });
      } catch (error) {
        const iterationEnd = process.hrtime.bigint();
        results.push({
          success: false,
          duration: Number(iterationEnd - iterationStart) / 1000000
        });
      }
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const successRate = results.filter(r => r.success).length / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const totalTime = Number(endTime - startTime) / 1000000;
    const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;

    return {
      responseTime: avgResponseTime,
      memoryUsage: memoryDiff,
      cpuUsage: (totalTime / iterations), // Rough CPU usage per iteration
      successRate
    };
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  reset(): void {
    this.metrics = [];
  }
}

export const performanceTestRunner = new PerformanceTestRunner();