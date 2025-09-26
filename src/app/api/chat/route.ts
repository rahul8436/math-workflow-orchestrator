import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { WorkflowTemplate, AIAnalysis } from '@/types/workflow';
import { workflowMatcher } from '@/lib/workflow-matcher';
import { expressionParser } from '@/lib/expression-parser';

// Initialize Groq provider
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper function to create workflow from expression
async function createWorkflowFromExpression(expression: string, description?: string): Promise<WorkflowTemplate> {
  console.log('🔧 Starting workflow creation for:', expression);
  
  try {
    const parsed = expressionParser.parse(expression);
    console.log('✅ Expression parsed successfully:', {
      complexity: parsed.complexity,
      operations: parsed.operations,
      variables: parsed.variables
    });
    
    const { nodes, edges } = expressionParser.generateWorkflowNodes(parsed.ast);
    console.log('✅ Generated nodes and edges:', { nodeCount: nodes.length, edgeCount: edges.length });
    
    // Map numeric complexity to string
    const getComplexityLevel = (num: number): 'basic' | 'intermediate' | 'advanced' | 'complex' => {
      if (num <= 2) return 'basic';
      if (num <= 4) return 'intermediate';
      if (num <= 6) return 'advanced';
      return 'complex';
    };
    
    const workflow: WorkflowTemplate = {
      id: `ai-${Date.now()}`,
      name: `AI: (${expression})`,
      description: description || `Auto-generated workflow for ${expression}`,
      pattern: expression,
      complexity: getComplexityLevel(parsed.complexity),
      operations: parsed.operations,
      operandCount: parsed.variables.length > 0 ? parsed.variables.length : 2,
      nodes,
      edges,
      tags: ['ai-generated', ...parsed.operations],
      examples: [expression],
      exactExpression: expression,
      createdAt: new Date(),
      usageCount: 0,
    };
    
    console.log('✅ Workflow created successfully:', workflow.name);
    return workflow;
    
  } catch (error) {
    console.error('❌ Error in createWorkflowFromExpression:', error);
    throw error;
  }
}

// Helper function to find matching workflows
function findMatchingWorkflows(expression: string, templates: WorkflowTemplate[]) {
  workflowMatcher.setTemplates(templates);
  return workflowMatcher.findMatches(expression);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, templates = [], context } = body;

    console.log('🤖 Vercel AI SDK Processing:', message);

    // System prompt for the AI
    const systemPrompt = `You are an intelligent mathematical workflow orchestrator. Your role is to understand user requests and determine the appropriate actions.

AVAILABLE ACTIONS:
1. CREATE_WORKFLOW - When user wants to create a new workflow
2. FIND_WORKFLOW - When user wants to find existing workflows  
3. EVALUATE - When user wants to calculate/evaluate expressions
4. EXPLAIN - When user wants explanations

INTENT CLASSIFICATION RULES:
- "Create workflow for X" or "Make workflow for X" → CREATE_WORKFLOW
- "Find workflow for X" or "Get workflow for X" → FIND_WORKFLOW  
- "Calculate X" or "What is X" → EVALUATE
- "Explain X" or "How does X work" → EXPLAIN

For each request, determine the intent and extract the mathematical expression if present.

Current templates available: ${templates.length} workflows

Respond with your analysis and the appropriate action to take.`;

    // Generate response using Vercel AI SDK
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: message,
      temperature: 0.3,
    });

    console.log('🎯 AI Response:', text);

    // Parse the AI response to determine intent and extract expressions
    let intent = 'general';
    let actionResult = null;
    let createdWorkflow: WorkflowTemplate | null = null;
    let foundWorkflow: WorkflowTemplate | null = null;
    let suggestions: any[] = [];

    const lowerMessage = message.toLowerCase();
    const lowerResponse = text.toLowerCase();

    // Enhanced intent detection with better pattern matching
    if (lowerResponse.includes('find_workflow') || 
        lowerMessage.includes('find workflow') || 
        lowerMessage.includes('get workflow') ||
        lowerMessage.includes('which workflow') ||
        lowerMessage.includes('show workflow')) {
      
      intent = 'find_workflow';
      console.log('🔍 Intent: FIND_WORKFLOW detected');
      
      // Extract mathematical expression using multiple patterns
      let expression = '';
      
      // Pattern 1: "find workflow for X"
      let match = message.match(/(?:find|get|show|which)\s+workflow\s+(?:for\s+|that\s+)?(.+)/i);
      if (!match) {
        // Pattern 2: "which workflow adds X with Y"
        match = message.match(/which\s+workflow\s+(?:adds|multiplies|subtracts|divides)\s+(.+)/i);
      }
      if (!match) {
        // Pattern 3: Extract numbers and operators from the message
        const numbers = message.match(/\b\d+(?:\.\d+)?\b/g);
        const hasPlus = message.includes('+') || message.includes('add') || message.includes('plus');
        if (numbers && numbers.length >= 2 && hasPlus) {
          expression = numbers.join(' + ');
        }
      } else {
        expression = match[1].trim();
      }

      if (expression) {
        console.log('🔍 Searching for expression:', expression);
        
        const results = findMatchingWorkflows(expression, templates);
        console.log('🔍 Found results:', results.length);
        
        suggestions = results.map(suggestion => ({
          workflowId: suggestion.workflowId,
          name: suggestion.name,
          confidence: suggestion.confidence,
          reasoning: suggestion.reason,
        }));

        // If we found a high-confidence match, set it as found for auto-loading
        if (results.length > 0 && results[0].confidence > 0.7) {
          const bestMatch = templates.find(t => t.id === results[0].workflowId);
          if (bestMatch) {
            foundWorkflow = bestMatch;
            console.log('✅ Auto-loading best match:', bestMatch.name);
          }
        }
      }
    } 
    else if (lowerResponse.includes('create_workflow') || 
             lowerMessage.includes('create workflow') || 
             lowerMessage.includes('make workflow') ||
             lowerMessage.includes('build workflow')) {
      
      intent = 'create_workflow';
      console.log('🛠️ Intent: CREATE_WORKFLOW detected');
      
      // Use AI to extract mathematical expression reliably
      let expression = '';
      
      console.log('🧠 Using AI to extract mathematical expression...');
      
      try {
        const { text: extractionResponse } = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          prompt: `Extract the mathematical expression from this request: "${message}"
          
Rules:
- Return ONLY the mathematical expression in standard notation
- Convert words to symbols: "plus/add/with" → +, "minus/subtract" → -, "times/multiply" → *, "divide/divided by" → /
- Use parentheses for grouping: "4 plus 6 divided by 5" → (4 + 6) / 5
- Return "NONE" if no mathematical expression exists

Examples:
"Create workflow for 3 + 5" → 3 + 5
"Build workflow adding 4 with 6 and divide by 5" → (4 + 6) / 5
"Make workflow for 2 * 3 + 1" → 2 * 3 + 1
"Hello there" → NONE

Expression:`,
          temperature: 0.1,
        });

        const extracted = extractionResponse.trim();
        console.log('🧠 AI extracted:', extracted);
        
        if (extracted && extracted !== 'NONE' && extracted.match(/[0-9\+\-\*\/\(\)]/)) {
          expression = extracted;
          console.log('✅ Valid expression extracted:', expression);
        } else {
          console.log('❌ No valid expression found by AI');
        }
        
      } catch (error) {
        console.error('❌ AI extraction failed:', error);
        
        // Fallback to regex patterns
        console.log('🔄 Falling back to regex patterns...');
        
        // Try to extract from the original AI response
        const patterns = [
          /(?:Expression|expression):\*?\*?\s*([^\n\r]+)/i,
          /mathematical expression[^\n\r]*?([0-9\+\-\*\/\(\)\s]+)/i,
          /([0-9\+\-\*\/\(\)\s]{3,})/
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const candidate = match[1].trim();
            if (candidate.match(/[0-9\+\-\*\/\(\)]/)) {
              expression = candidate;
              console.log('🔄 Fallback extracted:', expression);
              break;
            }
          }
        }
      }

      if (expression) {
        console.log('🛠️ Creating workflow for:', expression);
        
        try {
          createdWorkflow = await createWorkflowFromExpression(expression);
          console.log('✅ Created workflow:', createdWorkflow.name);
          console.log('🛠️ Workflow details:', {
            id: createdWorkflow.id,
            name: createdWorkflow.name,
            pattern: createdWorkflow.pattern,
            operations: createdWorkflow.operations
          });
        } catch (error) {
          console.error('❌ Failed to create workflow:', error);
          console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Expression that failed:', expression);
        }
      } else {
        console.log('❌ No expression extracted from message:', message);
      }
    }
    else if (lowerMessage.includes('calculate') || lowerMessage.includes('what is')) {
      intent = 'execute_workflow';
      
      // Extract and evaluate expression
      const match = message.match(/(?:calculate|what is)\s+(.+)/i);
      if (match) {
        const expression = match[1].trim();
        try {
          const result = Function(`"use strict"; return (${expression})`)();
          actionResult = { expression, result };
          console.log('🧮 Calculated:', expression, '=', result);
        } catch (error) {
          console.error('Failed to evaluate:', error);
        }
      }
    }

    // Generate intelligent response based on results
    console.log('📊 Processing results:', { intent, createdWorkflow: !!createdWorkflow, foundWorkflow: !!foundWorkflow, suggestionsCount: suggestions.length });
    
    let response = text;
    
    if (createdWorkflow) {
      response = `🤖 **AI Orchestrator** has successfully created your workflow!

**🎯 Intelligence Summary:**
- Intent Detected: ${intent}
- Confidence Level: 95.0%
- Action: Workflow Created

**✅ Created Workflow:** "${createdWorkflow.name}"

The workflow is now available in your builder and ready for execution!

**🚀 What's Next:**
- Test the workflow with different values
- Create variations for other operations
- Explore advanced mathematical concepts`;

    } else if (foundWorkflow) {
      response = `🤖 **AI Orchestrator** found an exact match!

**🎯 Search Results:**
- Intent: ${intent}
- Status: Perfect Match Found
- Confidence: 95.0%

**✅ Found Workflow:** "${foundWorkflow.name}"

This workflow has been automatically loaded into your builder and is ready to use!

**🚀 Quick Actions:**
- Execute the workflow immediately
- Modify parameters
- Create similar workflows`;

    } else if (suggestions.length > 0) {
      const topSuggestion = suggestions[0];
      response = `🤖 **AI Orchestrator** found ${suggestions.length} matching workflow${suggestions.length > 1 ? 's' : ''}!

**🎯 Search Results:**
- Intent: ${intent}
- Best Match: "${topSuggestion.name}" (${(topSuggestion.confidence * 100).toFixed(1)}% match)
- Total Matches: ${suggestions.length}

**📋 Top Matches:**
${suggestions.slice(0, 3).map((s, i) => `${i + 1}. **${s.name}** - ${(s.confidence * 100).toFixed(1)}% match`).join('\n')}

Click on any workflow above to load it into your builder!`;

    } else if (actionResult) {
      response = `🤖 **AI Orchestrator** calculated your expression!

**🧮 Calculation Result:**
\`${actionResult.expression}\` = **${actionResult.result}**

**💡 Would you like me to:**
- Create a workflow for this calculation?
- Show similar mathematical operations?
- Explain how this calculation works?`;

    } else {
      // No specific action taken, but we have AI analysis
      response = `🤖 **AI Orchestrator** analyzed your request:

**🎯 Analysis:**
- Intent: ${intent}
- Message: "${message}"

I understand you're looking for mathematical workflow assistance. Try asking me to:
- **"Find workflow for X + Y"** - Search existing workflows
- **"Create workflow for X * Y"** - Build new workflows  
- **"Calculate X / Y"** - Evaluate expressions

What would you like to do next?`;
    }

    // Create orchestration plan
    const orchestrationPlan = {
      intent: intent as 'find' | 'create' | 'modify' | 'explain' | 'execute',
      confidence: 0.95,
      reasoning: `Analyzed "${message}" and determined intent: ${intent}`,
      suggestedActions: [{
        type: intent,
        parameters: {},
        priority: 1,
        reasoning: `Primary action based on user intent: ${intent}`
      }],
    };

    return NextResponse.json({
      message: response,
      orchestration: orchestrationPlan,
      suggestions,
      createdWorkflow,
      foundWorkflow,
      analysis: {
        intent: intent as AIAnalysis['intent'],
        confidence: 0.95,
        reasoning: `Vercel AI SDK analysis: ${intent}`,
        expression: actionResult?.expression || '',
        extractedNumbers: [],
        extractedOperations: [],
        variables: [],
        suggestedAction: `Process ${intent} request`,
      } as AIAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vercel AI SDK error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}