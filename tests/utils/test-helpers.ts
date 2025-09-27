import fetch from 'node-fetch';

// Test utilities
export interface APITestResponse {
  message: string;
  analysis?: {
    intent: string;
    confidence: number;
    reasoning: string;
  };
  createdWorkflow?: any;
  foundWorkflow?: any;
  suggestions?: any[];
  orchestration?: any;
}

export class APITestClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = global.TEST_CONFIG?.API_URL || 'http://localhost:3001/api/chat', timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
  }

  async sendMessage(message: string, templates: any[] = [], context: any = {}): Promise<APITestResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, templates, context }),
      signal: AbortSignal.timeout(this.defaultTimeout)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as APITestResponse;
  }

  async testIntentDetection(message: string, expectedIntent: string): Promise<{ success: boolean; actualIntent: string; response: APITestResponse }> {
    const response = await this.sendMessage(message);
    const actualIntent = response.analysis?.intent || 'unknown';
    
    return {
      success: actualIntent === expectedIntent,
      actualIntent,
      response
    };
  }

  async testWorkflowCreation(message: string): Promise<{ success: boolean; workflow: any; response: APITestResponse }> {
    const response = await this.sendMessage(message);
    const success = !!response.createdWorkflow;
    
    return {
      success,
      workflow: response.createdWorkflow,
      response
    };
  }

  async testWorkflowFinding(message: string, templates: any[]): Promise<{ success: boolean; found: any; suggestions: any[]; response: APITestResponse }> {
    const response = await this.sendMessage(message, templates);
    const success = !!response.foundWorkflow || (response.suggestions && response.suggestions.length > 0);
    
    return {
      success,
      found: response.foundWorkflow,
      suggestions: response.suggestions || [],
      response
    };
  }
}

// Validation helpers
export function isValidWorkflow(workflow: any): boolean {
  return workflow && 
         typeof workflow.id === 'string' &&
         typeof workflow.name === 'string' &&
         typeof workflow.pattern === 'string' &&
         Array.isArray(workflow.operations) &&
         Array.isArray(workflow.nodes) &&
         Array.isArray(workflow.edges) &&
         workflow.nodes.length > 0;
}

export function isValidExpression(expression: string): boolean {
  return typeof expression === 'string' &&
         expression.length > 0 &&
         expression.length < 200 &&
         /^[0-9\+\-\*\/\(\)\s]+$/.test(expression.trim());
}

export function isValidIntent(intent: string): boolean {
  return ['create_workflow', 'find_workflow', 'execute_workflow', 'general'].includes(intent);
}

// Test data generators
export class TestDataGenerator {
  static getSimpleExpressions(): string[] {
    return [
      '1 + 2',
      '5 - 3',
      '4 * 6',
      '8 / 2',
      '10 + 5 - 3',
      '2 * 3 + 4',
      '12 / 4 * 2',
      '(5 + 3) * 2',
      '10 / (2 + 3)',
      '2 * (4 + 6) / 5'
    ];
  }

  static getComplexExpressions(): string[] {
    return [
      '((4 + 6 + 8 + 9) / 10) * 7',
      '50 * 80 / 40 - 30 + 90',
      '(12 + 15) * 3 - 20 / 4',
      '100 - (25 + 30) * 2 / 5',
      '((8 * 9) + (12 / 3)) - 15',
      '(45 / 9 + 20) * (8 - 5)',
      '150 / (10 + 5) * 4 - 12',
      '((100 - 20) / 8 + 5) * 3',
      '75 + 25 * 2 - 100 / 10',
      '(((12 + 8) * 5) / 4) - 30'
    ];
  }

  static getCreateMessages(): string[] {
    return [
      'create 3 + 5',
      'make a workflow for 10 * 2',
      'build workflow for (4 + 6) / 5',
      'generate 15 - 8 + 3',
      'create workflow adding 4 with 6 and divide by 2',
      'make a workflow for multiplying 7 with 8',
      'build 20 / 4 + 10',
      'create complex expression (12 + 8) * 3 - 15',
      'generate workflow for 100 - 25 * 2',
      'create ((5 + 10) * 2) / 3'
    ];
  }

  static getFindMessages(): string[] {
    return [
      'find 3 + 5',
      'search for 10 * 2',
      'get workflow for (4 + 6) / 5',
      'show me 15 - 8 + 3',
      'find workflow for adding 4 with 6',
      'search workflow that multiplies 7 with 8',
      'which workflow does 20 / 4 + 10',
      'locate workflow for (12 + 8) * 3 - 15',
      'get the workflow for 100 - 25 * 2',
      'find ((5 + 10) * 2) / 3'
    ];
  }

  static getEdgeCases(): Array<{ message: string; expectedIntent?: string; shouldSucceed?: boolean; description: string }> {
    return [
      {
        message: 'create',
        expectedIntent: 'general',
        shouldSucceed: false,
        description: 'CREATE without expression'
      },
      {
        message: 'find',
        expectedIntent: 'general',
        shouldSucceed: false,
        description: 'FIND without expression'
      },
      {
        message: 'create hello world',
        expectedIntent: 'create_workflow',
        shouldSucceed: false,
        description: 'CREATE with non-mathematical text'
      },
      {
        message: 'find hello world',
        expectedIntent: 'find_workflow',
        shouldSucceed: false,
        description: 'FIND with non-mathematical text'
      },
      {
        message: 'create 1 + ',
        expectedIntent: 'create_workflow',
        shouldSucceed: false,
        description: 'Incomplete expression'
      },
      {
        message: 'create (((((1 + 2',
        expectedIntent: 'create_workflow',
        shouldSucceed: false,
        description: 'Unbalanced parentheses'
      },
      {
        message: 'create 999999999999 * 888888888888',
        expectedIntent: 'create_workflow',
        shouldSucceed: true,
        description: 'Very large numbers'
      },
      {
        message: 'create 0 / 0',
        expectedIntent: 'create_workflow',
        shouldSucceed: true,
        description: 'Division by zero (should create but might fail execution)'
      },
      {
        message: 'CREATE 5 + 3',
        expectedIntent: 'create_workflow',
        shouldSucceed: true,
        description: 'Uppercase CREATE'
      },
      {
        message: 'FIND 5 + 3',
        expectedIntent: 'find_workflow',
        shouldSucceed: true,
        description: 'Uppercase FIND'
      }
    ];
  }

  static getInvalidInputs(): Array<{ message: string; description: string }> {
    return [
      { message: '', description: 'Empty message' },
      { message: '   ', description: 'Whitespace only' },
      { message: 'random text with no intent', description: 'No clear intent' },
      { message: '12345', description: 'Numbers only' },
      { message: '+-*/', description: 'Operators only' },
      { message: 'create ' + 'a'.repeat(1000), description: 'Extremely long message' },
      { message: 'create \n\n\n 5 + 3', description: 'Message with newlines' },
      { message: 'create 5 + 3; DROP TABLE workflows;', description: 'Potential injection' }
    ];
  }
}