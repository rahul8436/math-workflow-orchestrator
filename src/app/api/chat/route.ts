import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { AIAnalysis, WorkflowTemplate, OperationType } from '@/types/workflow';
import { workflowMatcher } from '@/lib/workflow-matcher';
import { expressionParser } from '@/lib/expression-parser';
import { aiOrchestrator } from '@/lib/ai-orchestrator';
import { getModelForTask, getMaxTokensForModel } from '@/lib/ai-models';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper functions for intent analysis
function extractNumbers(text: string): number[] {
  const numberMatches = text.match(/\b\d+(?:\.\d+)?\b/g);
  return numberMatches ? numberMatches.map(num => parseFloat(num)) : [];
}

function extractOperationsFromText(text: string): OperationType[] {
  const operations: OperationType[] = [];
  const lowerText = text.toLowerCase();
  
  // Addition patterns
  if (lowerText.includes('add') || lowerText.includes('+') || lowerText.includes('plus') || 
      lowerText.includes('sum') || lowerText.includes('adding')) {
    operations.push('addition');
  }
  
  // Subtraction patterns  
  if (lowerText.includes('subtract') || lowerText.includes('-') || lowerText.includes('minus')) {
    operations.push('subtraction');
  }
  
  // Multiplication patterns
  if (lowerText.includes('multiply') || lowerText.includes('*') || lowerText.includes('times') || 
      lowerText.includes('×') || lowerText.includes('multiplying')) {
    operations.push('multiplication');
  }
  
  // Division patterns - including compound phrases
  if (lowerText.includes('divide') || lowerText.includes('/') || lowerText.includes('÷') || 
      lowerText.includes('dividing') || lowerText.includes('divided by')) {
    operations.push('division');
  }
  
  return operations;
}

function extractVariables(text: string): string[] {
  const variableMatches = text.match(/\b[a-z]\b/gi);
  return variableMatches ? [...new Set(variableMatches.map(v => v.toLowerCase()))] : [];
}

function generateExpressionFromContext(text: string, numbers: number[], operations: string[]): string {
  // Try to extract existing mathematical expressions first
  const mathExpressionMatch = text.match(/[\d\s\+\-\*\/\(\)]+/g);
  if (mathExpressionMatch && mathExpressionMatch.length > 0) {
    const cleanExpression = mathExpressionMatch.join(' ').trim();
    if (cleanExpression.length > 3) { // Basic validation
      return cleanExpression;
    }
  }

  // Handle compound operations with specific patterns
  if (numbers.length >= 3 && operations.length >= 2) {
    // Pattern: "adding X with Y and divide by Z" -> (X + Y) / Z
    if (operations.includes('addition') && operations.includes('division')) {
      return `(${numbers[0]} + ${numbers[1]}) / ${numbers[2]}`;
    }
    // Pattern: "multiply X with Y and subtract Z" -> (X * Y) - Z  
    if (operations.includes('multiplication') && operations.includes('subtraction')) {
      return `(${numbers[0]} * ${numbers[1]}) - ${numbers[2]}`;
    }
    // Default compound pattern
    return `${numbers[0]} ${getOperatorSymbol(operations[0])} ${numbers[1]} ${getOperatorSymbol(operations[1])} ${numbers[2]}`;
  }

  // Handle simple two-number operations
  if (numbers.length >= 2 && operations.length > 0) {
    const op = getOperatorSymbol(operations[0]);
    return `${numbers[0]} ${op} ${numbers[1]}`;
  }

  return '';
}

function getOperatorSymbol(operation: string): string {
  switch (operation) {
    case 'addition': return '+';
    case 'subtraction': return '-';
    case 'multiplication': return '*';
    case 'division': return '/';
    default: return '+';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, templates, context } = await req.json();

    console.log('🔍 API: Received templates count:', templates?.length || 0);
    console.log('🔍 API: User-created workflows:', templates?.filter((t: any) => t.tags.includes('user-created')).length || 0);
    console.log('🔍 API: Template IDs:', templates?.map((t: any) => ({ id: t.id, name: t.name })) || []);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize workflow matcher with current templates
    if (templates) {
      workflowMatcher.setTemplates(templates);
    }

    let orchestrationPlan = null;
    let aiAnalysis = null;
    let response: string;
    let createdWorkflow: WorkflowTemplate | null = null;
    let foundWorkflow: WorkflowTemplate | null = null; // Add this for auto-loading workflows
    let suggestions: any[] = [];

    try {
      // PRIMARY: Try AI Orchestrator for intelligent processing
      if (context?.userHistory) {
        aiOrchestrator.updateContext({ userHistory: context.userHistory });
      }

      orchestrationPlan = await aiOrchestrator.orchestrateRequest(message, templates || []);

      console.log('🎯 Chat API: Orchestration plan:', {
        intent: orchestrationPlan.intent,
        confidence: orchestrationPlan.confidence,
        reasoning: orchestrationPlan.reasoning
      });

      // Execute orchestrated actions
      for (const action of orchestrationPlan.suggestedActions) {
        console.log('🔄 Chat API: Executing action:', action.type, 'with priority:', action.priority);
        switch (action.type) {
          case 'search_workflows':
            suggestions = workflowMatcher.findMatches(message, {
              intent: orchestrationPlan.intent === 'find' ? 'find_workflow' : 
                     orchestrationPlan.intent === 'create' ? 'create_workflow' : 
                     orchestrationPlan.intent === 'execute' ? 'execute_workflow' : 'general',
              confidence: orchestrationPlan.confidence,
              extractedNumbers: [],
              extractedOperations: [],
              variables: [],
              suggestedAction: action.reasoning
            });
            
            // Auto-load high confidence matches for FIND operations
            if (suggestions.length > 0 && orchestrationPlan.intent === 'find' && orchestrationPlan.confidence > 0.8) {
              const bestMatch = suggestions[0];
              if (bestMatch.confidence > 0.7 && templates) {
                foundWorkflow = templates.find((t: WorkflowTemplate) => t.id === bestMatch.workflowId) || null;
                console.log('🎯 Chat API: Auto-loading workflow:', foundWorkflow?.name);
              }
            }
            break;

          case 'create_workflow':
            // Only create if confidence is very high and no good existing matches
            if (orchestrationPlan.confidence > 0.9 || suggestions.length === 0) {
              const createResult = await handleIntelligentWorkflowCreation(message, orchestrationPlan);
              if (createResult.workflow) {
                createdWorkflow = createResult.workflow;
                console.log('🏗️ Chat API: Created workflow:', createdWorkflow.name);
              }
            } else {
              console.log('⚠️ Chat API: Skipping creation - found existing matches or low confidence');
            }
            break;
        }
      }

      // Generate intelligent response
      response = await generateIntelligentResponse(message, orchestrationPlan, suggestions, createdWorkflow, foundWorkflow);

    } catch (orchestrationError) {
      console.warn('AI Orchestration failed, falling back to manual analysis:', orchestrationError);

      // FALLBACK: Use original manual analysis system
      aiAnalysis = await analyzeUserIntent(message);
      suggestions = workflowMatcher.findMatches(message, aiAnalysis);

      // Determine response based on intent using original logic
      switch (aiAnalysis.intent) {
        case 'find_workflow':
          response = handleFindWorkflow(message, suggestions, aiAnalysis);
          break;

        case 'create_workflow':
          const result = await handleCreateWorkflow(message, aiAnalysis);
          response = result.response;
          createdWorkflow = result.workflow;
          break;

        case 'execute_workflow':
          response = handleExecuteWorkflow(message, suggestions, aiAnalysis);
          break;

        case 'explain':
          response = handleExplain(message, suggestions);
          break;

        default:
          response = handleGeneral(message, suggestions);
      }
    }

    return NextResponse.json({
      message: response,
      analysis: aiAnalysis, // Original analysis (fallback)
      orchestration: orchestrationPlan, // AI orchestration (primary)
      suggestions,
      createdWorkflow: createdWorkflow, // Send the full object for adding to templates
      foundWorkflow: foundWorkflow, // Send found workflow for auto-loading
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeUserIntent(message: string): Promise<AIAnalysis> {
  // Use LLM-based intent classification with comprehensive fallback chain
  const intentAnalysis = await performLLMIntentClassification(message);
  if (intentAnalysis) {
    return intentAnalysis;
  }

  // Ultimate fallback - manual pattern matching (should rarely be needed)
  return performFallbackIntentAnalysis(message);
}

async function performLLMIntentClassification(message: string): Promise<AIAnalysis | null> {
  const systemPrompt = `You are a strict intent classifier for mathematical workflow commands. Analyze the user's message and classify the intent with high precision.

INTENT CLASSIFICATION RULES:

🔍 FIND_WORKFLOW - User wants to locate existing workflows:
- Keywords: "get", "find", "show", "search", "from templates", "existing", "what workflow", "which workflow"
- Examples: "get me the workflow from templates", "find workflow for 3+5", "show me existing addition workflow"

🏗️ CREATE_WORKFLOW - User wants to build new workflows:
- Keywords: "create", "make", "build", "generate", "new", "design"  
- Examples: "create workflow for x+y", "make a workflow", "build new calculation"

▶️ EXECUTE_WORKFLOW - User wants to calculate/run expressions:
- Keywords: "calculate", "compute", "solve", "what is", "execute", "run"
- Examples: "calculate 5+3", "what is 10*2", "solve this expression"

❓ EXPLAIN - User wants explanations/help:
- Keywords: "explain", "how", "why", "help", "what does", "understand"
- Examples: "explain workflows", "how does addition work", "help me understand"

🗨️ GENERAL - Conversational/unclear intent:
- Everything else, greetings, unclear requests

CRITICAL RULES:
- If message contains "create" + expression → CREATE_WORKFLOW (confidence: 0.95+)
- If message contains "get/find" + "templates/existing" → FIND_WORKFLOW (confidence: 0.95+)
- If message contains "calculate/what is" + numbers → EXECUTE_WORKFLOW (confidence: 0.9+)

User Message: "${message}"

Respond with ONLY this JSON format:
{
  "intent": "find_workflow|create_workflow|execute_workflow|explain|general",
  "expression": "extracted mathematical expression or empty string",
  "extractedNumbers": [array of numbers found],
  "extractedOperations": ["addition|subtraction|multiplication|division"],
  "variables": ["x", "y", "z"],
  "confidence": 0.0-1.0,
  "suggestedAction": "brief explanation of reasoning",
  "reasoning": "detailed explanation of why this intent was chosen"
}`;

  // Comprehensive model fallback chain for intent classification
  const intentModels = [
    { id: 'llama-3.3-70b-versatile', name: 'Primary Analysis' },
    { id: 'openai/gpt-oss-120b', name: 'OpenAI 120B Backup' }, 
    { id: 'llama-3.1-8b-instant', name: 'Fast Fallback' },
    { id: 'openai/gpt-oss-20b', name: 'OpenAI 20B Fallback' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Preview' },
    { id: 'qwen/qwen3-32b', name: 'Qwen Alternative' },
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Moonshot Emergency' }
  ];

  for (const model of intentModels) {
    try {
      console.log(`🎯 Intent Classification: Trying ${model.name} (${model.id})`);
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: model.id,
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const analysisText = completion.choices[0]?.message?.content || '{}';
      console.log(`✅ Intent Analysis from ${model.name}:`, analysisText);

      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error(`❌ JSON parse error with ${model.name}:`, parseError);
        continue; // Try next model
      }

      // Validate analysis structure
      if (!analysis.intent || !analysis.confidence) {
        console.error(`❌ Invalid analysis structure from ${model.name}`);
        continue;
      }

      // Return successful analysis
      return {
        intent: analysis.intent || 'general',
        expression: analysis.expression || '',
        extractedNumbers: analysis.extractedNumbers || [],
        extractedOperations: analysis.extractedOperations || [],
        variables: analysis.variables || [],
        confidence: analysis.confidence || 0.5,
        suggestedAction: analysis.suggestedAction || 'Process user request',
        reasoning: analysis.reasoning || `Classified by ${model.name}`
      };

    } catch (error: any) {
      console.error(`❌ Intent classification failed with ${model.name}:`, error.message);
      
      // Handle rate limits specifically
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        console.log(`⚠️ Rate limit hit for ${model.name}, trying next model...`);
        continue;
      }
      
      // Handle other API errors
      if (error.message?.includes('model') && error.message?.includes('not found')) {
        console.log(`⚠️ Model ${model.id} not available, trying next...`);
        continue;
      }
      
      continue; // Try next model for any other error
    }
  }

  console.error('❌ All intent classification models failed');
  return null;
}

async function performFallbackIntentAnalysis(message: string): Promise<AIAnalysis> {
  console.log('🔄 Using fallback intent analysis');
  
  // Simple pattern-based fallback
  const lowerMessage = message.toLowerCase().trim();
  const numbers = extractNumbers(message);
  const operations = extractOperationsFromText(message);
  const expression = generateExpressionFromContext(message, numbers, operations);
  
  // Basic intent classification
  if (lowerMessage.includes('create') && (lowerMessage.includes('workflow') || numbers.length > 0)) {
    return {
      intent: 'create_workflow',
      expression,
      extractedNumbers: numbers,
      extractedOperations: operations,
      variables: extractVariables(message),
      confidence: 0.8,
      suggestedAction: 'Create new workflow (fallback analysis)'
    };
  }
  
  if ((lowerMessage.includes('find') || lowerMessage.includes('get') || lowerMessage.includes('show')) && 
      (lowerMessage.includes('workflow') || lowerMessage.includes('template'))) {
    return {
      intent: 'find_workflow',
      expression,
      extractedNumbers: numbers,
      extractedOperations: operations,
      variables: extractVariables(message),
      confidence: 0.8,
      suggestedAction: 'Find existing workflow (fallback analysis)'
    };
  }
  
  if (lowerMessage.includes('calculate') || lowerMessage.includes('what is') || 
      (numbers.length >= 2 && operations.length > 0)) {
    return {
      intent: 'execute_workflow',
      expression,
      extractedNumbers: numbers,
      extractedOperations: operations,
      variables: extractVariables(message),
      confidence: 0.7,
      suggestedAction: 'Execute calculation (fallback analysis)'
    };
  }
  
  // Default to general
  return {
    intent: 'general',
    expression: '',
    extractedNumbers: numbers,
    extractedOperations: operations,
    variables: extractVariables(message),
    confidence: 0.5,
    suggestedAction: 'General assistance (fallback analysis)'
  };
}

function handleFindWorkflow(message: string, suggestions: any[], analysis: AIAnalysis): string {
  return workflowMatcher.generateResponseSuggestions(message, suggestions);
}

async function handleCreateWorkflow(message: string, analysis: AIAnalysis): Promise<{
  response: string;
  workflow: WorkflowTemplate | null;
}> {
  try {
    if (!analysis.expression) {
      return {
        response: "I'd be happy to create a workflow for you! Could you please provide the mathematical expression you'd like to work with? For example: '3 + 5 - 2' or 'x * y / z'",
        workflow: null
      };
    }

    // Parse the expression
    const parsed = expressionParser.parse(analysis.expression);
    const { nodes, edges } = expressionParser.generateWorkflowNodes(parsed.ast);

    // Generate workflow template
    const workflow: WorkflowTemplate = {
      id: `custom-${Date.now()}`,
      name: `Custom: ${analysis.expression}`,
      description: `Custom workflow for expression: ${analysis.expression}`,
      pattern: analysis.expression,
      complexity: parsed.complexity > 3 ? 'complex' : parsed.complexity > 2 ? 'advanced' : parsed.complexity > 1 ? 'intermediate' : 'basic',
      operations: parsed.operations,
      operandCount: parsed.variables.length || analysis.extractedNumbers.length,
      nodes,
      edges,
      tags: ['custom', 'user-created', ...parsed.operations],
      examples: [analysis.expression],
      createdAt: new Date(),
      usageCount: 0
    };

    const response = `✅ I've successfully created a custom workflow for "${analysis.expression}"!\n\n` +
      `**Workflow Details:**\n` +
      `- Pattern: ${workflow.pattern}\n` +
      `- Operations: ${workflow.operations.join(', ')}\n` +
      `- Complexity: ${workflow.complexity}\n` +
      `- Operands: ${workflow.operandCount}\n\n` +
      `The workflow has been added to your workflow library and is now visible in the left panel. You can use it immediately or modify it as needed.`;

    return { response, workflow };

  } catch (error: any) {
    return {
      response: `I encountered an issue creating the workflow: ${error.message}. Could you please rephrase your expression?`,
      workflow: null
    };
  }
}

function handleExecuteWorkflow(message: string, suggestions: any[], analysis: AIAnalysis): string {
  if (suggestions.length === 0) {
    return "I couldn't find a matching workflow to execute. Would you like me to create a new workflow for this expression?";
  }

  const bestMatch = suggestions[0];
  return `I found the "${bestMatch.name}" workflow that matches your request (${(bestMatch.confidence * 100).toFixed(1)}% confidence).\n\n` +
    `To execute it, please:\n` +
    `1. Click on the "${bestMatch.name}" workflow in the left panel\n` +
    `2. Enter your values in the operand nodes\n` +
    `3. The result will be calculated automatically\n\n` +
    `Would you like me to load this workflow for you?`;
}

function handleExplain(message: string, suggestions: any[]): string {
  if (message.toLowerCase().includes('workflow')) {
    return "Workflows are visual representations of mathematical calculations. Each workflow consists of:\n\n" +
      "🔢 **Operand nodes**: Hold numbers or variables (like x, y, z)\n" +
      "⚡ **Operator nodes**: Perform calculations (+, -, ×, ÷)\n" +
      "📊 **Result nodes**: Display the final answer\n" +
      "🔗 **Edges**: Connect nodes to show data flow\n\n" +
      "You can create workflows by describing expressions like '3 + 5 * 2' or 'x + y - z / u'. The system will automatically build the visual workflow for you!";
  }

  return "I can help explain mathematical concepts, workflow operations, or how to use this tool. What specifically would you like to know more about?";
}

function handleGeneral(message: string, suggestions: any[]): string {
  if (suggestions.length > 0) {
    return workflowMatcher.generateResponseSuggestions(message, suggestions);
  }

  return "I'm your intelligent workflow orchestrator! I can help you:\n\n" +
    "🔍 **Find workflows**: 'Find the workflow which is adding 4 with 7?'\n" +
    "🏗️ **Create workflows**: 'Create a workflow for 3 + 5 * 2'\n" +
    "▶️ **Execute calculations**: 'Calculate 10 + 15 - 8'\n" +
    "❓ **Explain concepts**: 'How does the workflow system work?'\n\n" +
    "Just describe what you want to calculate or ask me any question!";
}

async function handleIntelligentWorkflowCreation(message: string, orchestrationPlan: any): Promise<{
  response: string;
  workflow: WorkflowTemplate | null;
}> {
  try {
    // Extract mathematical expression using AI analysis with fallback models
    const systemPrompt = `Extract ONLY the mathematical expression from: "${message}"

    Pay attention to intended order of operations:
    - "add A and B then divide by C" → (A + B) / C
    - "adding A+B and divide by C" → (A + B) / C

    CRITICAL: Return ONLY the mathematical expression, nothing else. No explanations.
    Examples: (4 + 5) / 3, 2 * (3 + 1), x + y / z
    If no expression found, return: NONE`;

    // Try multiple models with fallback
    const models = [
      { id: getModelForTask('simple'), desc: 'simple extraction' },
      { id: getModelForTask('fallback'), desc: 'fallback extraction' }
    ];

    let expression = null;

    for (const modelInfo of models) {
      try {
        const maxTokens = getMaxTokensForModel(modelInfo.id);
        
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: systemPrompt }],
          model: modelInfo.id,
          temperature: 0.1,
          max_tokens: Math.min(maxTokens, 100)
        });

        const rawExpression = completion.choices[0]?.message?.content?.trim();
        
        if (rawExpression) {
          // Extract expression from potential longer response
          // Look for patterns like (4 + 5) / 3 or 4 + 5 / 3
          const expressionMatch = rawExpression.match(/[\d\w\s+\-*/()]+/);
          expression = expressionMatch ? expressionMatch[0].trim() : rawExpression;
          
          // Clean up the expression - remove quotes and extra text
          expression = expression.replace(/^["']|["']$/g, '').trim();
          
          // If it's just numbers and operations, it's likely valid
          if (expression && /^[\d\w\s+\-*/().]+$/.test(expression) && expression !== 'NONE') {
            console.log(`Expression extracted using ${modelInfo.desc} model: ${expression}`);
            break;
          }
        }
      } catch (error) {
        console.error(`Expression extraction failed with ${modelInfo.desc} model:`, error);
        continue;
      }
    }

    if (!expression || expression === 'NONE') {
      return {
        response: "I'd be happy to create a workflow for you! Could you please provide the mathematical expression you'd like to work with? For example: '3 + 5 - 2' or 'x * y / z'",
        workflow: null
      };
    }

    // Parse the expression
    const parsed = expressionParser.parse(expression);
    const { nodes, edges } = expressionParser.generateWorkflowNodes(parsed.ast);

    // Generate workflow template with AI-enhanced details
    const workflow: WorkflowTemplate = {
      id: `ai-created-${Date.now()}`,
      name: `AI: ${expression}`,
      description: `AI-generated workflow for expression: ${expression} (Confidence: ${(orchestrationPlan.confidence * 100).toFixed(1)}%)`,
      pattern: expression,
      complexity: parsed.complexity > 3 ? 'complex' : parsed.complexity > 2 ? 'advanced' : parsed.complexity > 1 ? 'intermediate' : 'basic',
      operations: parsed.operations,
      operandCount: parsed.variables.length || parsed.operations.length + 1,
      nodes,
      edges,
      tags: ['ai-created', 'intelligent', ...parsed.operations],
      examples: [expression],
      createdAt: new Date(),
      usageCount: 0
    };

    const response = `🤖 **AI Orchestrator** has intelligently created a workflow for "${expression}"!\n\n` +
      `**Deep Analysis Results:**\n` +
      `- Intent: ${orchestrationPlan.intent}\n` +
      `- Confidence: ${(orchestrationPlan.confidence * 100).toFixed(1)}%\n` +
      `- Reasoning: ${orchestrationPlan.reasoning}\n\n` +
      `**Workflow Specifications:**\n` +
      `- Pattern: ${workflow.pattern}\n` +
      `- Operations: ${workflow.operations.join(', ')}\n` +
      `- Complexity: ${workflow.complexity}\n` +
      `- Components: ${workflow.operandCount} operands\n\n` +
      `✨ This workflow has been intelligently optimized and is ready for immediate use in the visual builder!`;

    return { response, workflow };

  } catch (error: any) {
    console.warn('Intelligent workflow creation failed, falling back to manual method:', error);

    // FALLBACK: Use the original manual workflow creation method
    const fallbackAnalysis = await performFallbackIntentAnalysis(message);
    const manualResult = await handleCreateWorkflow(message, fallbackAnalysis);

    // Enhance the manual result with orchestration context
    if (manualResult.workflow) {
      manualResult.response = `⚙️ **Manual Workflow Creation** (AI fallback)\n\n` + manualResult.response;
    } else {
      manualResult.response = `I encountered an issue with both AI and manual workflow creation. ${manualResult.response}`;
    }

    return manualResult;
  }
}

async function generateIntelligentResponse(
  message: string,
  orchestrationPlan: any,
  suggestions: any[],
  createdWorkflow: WorkflowTemplate | null,
  foundWorkflow: WorkflowTemplate | null = null
): Promise<string> {

  // If a workflow was created, show creation response
  if (createdWorkflow) {
    return `🤖 **AI Orchestrator** has successfully processed your request!\n\n` +
      `**Intelligence Summary:**\n` +
      `- Intent Detected: ${orchestrationPlan.intent}\n` +
      `- Confidence Level: ${(orchestrationPlan.confidence * 100).toFixed(1)}%\n` +
      `- Actions Coordinated: ${orchestrationPlan.suggestedActions.length}\n\n` +
      `**Created Workflow:** "${createdWorkflow.name}"\n` +
      `The workflow is now available in your builder and ready for execution!\n\n` +
      `**Next Steps:**\n` +
      `${orchestrationPlan.alternativeOptions.map((option: string, i: number) => `${i + 1}. ${option}`).join('\n')}`;
  }

  // If finding workflows and we have high-confidence matches, auto-load the best one
  if (suggestions.length > 0 && orchestrationPlan.intent === 'find') {
    const bestMatch = suggestions[0];
    
    // If high confidence match (>80%), auto-load it
    if (bestMatch.confidence > 0.8) {
      return `🎯 **Perfect Match Found!**\n\n` +
        `🤖 **AI Orchestrator** found an exact workflow match:\n\n` +
        `**"${bestMatch.name}"** (${(bestMatch.confidence * 100).toFixed(1)}% confidence)\n` +
        `**Reason:** ${bestMatch.reason}\n\n` +
        `✅ **Automatically loaded** this workflow into your builder!\n` +
        `You can see it on the left panel and start using it immediately.\n\n` +
        `**Analysis:**\n` +
        `- Intent: ${orchestrationPlan.intent}\n` +
        `- Confidence: ${(orchestrationPlan.confidence * 100).toFixed(1)}%\n` +
        `- Actions: ${orchestrationPlan.suggestedActions.length} coordinated`;
    } else {
      // Lower confidence - show options
      return `🤖 **AI Orchestrator** found ${suggestions.length} matching workflow${suggestions.length > 1 ? 's' : ''}!\n\n` +
        `**Best Match:** "${bestMatch.name}" (${(bestMatch.confidence * 100).toFixed(1)}% confidence)\n` +
        `**AI Analysis:** ${orchestrationPlan.reasoning}\n\n` +
        `**Orchestrated Actions:**\n` +
        `${orchestrationPlan.suggestedActions.map((action: any) => `• ${action.reasoning}`).join('\n')}\n\n` +
        `Would you like me to load this workflow for immediate use?`;
    }
  }

  // If no workflows found but intent was to find, suggest creation
  if (suggestions.length === 0 && orchestrationPlan.intent === 'find') {
    return `🤖 **AI Orchestrator** searched thoroughly but couldn't find an exact match.\n\n` +
      `**Search Results:**\n` +
      `- Intent: ${orchestrationPlan.intent}\n` +
      `- Confidence: ${(orchestrationPlan.confidence * 100).toFixed(1)}%\n` +
      `- Workflows Searched: ${orchestrationPlan.suggestedActions.length > 0 ? 'All available templates' : 'None available'}\n\n` +
      `💡 **Suggestion:** We don't have that specific workflow yet, but I can create one for you!\n\n` +
      `Just say: **"Create workflow for [your specific calculation]"** and I'll build it instantly.`;
  }

  // Fallback intelligent response
  return `🤖 **AI Orchestrator** analyzed your request:\n\n` +
    `**Analysis:**\n` +
    `- Intent: ${orchestrationPlan.intent}\n` +
    `- Confidence: ${(orchestrationPlan.confidence * 100).toFixed(1)}%\n` +
    `- Reasoning: ${orchestrationPlan.reasoning}\n\n` +
    `**Available Actions:**\n` +
    `${orchestrationPlan.suggestedActions.map((action: any) => `• ${action.reasoning}`).join('\n')}\n\n` +
    `How would you like me to proceed with your mathematical workflow needs?`;
}