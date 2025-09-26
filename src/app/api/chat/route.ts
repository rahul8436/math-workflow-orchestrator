import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { AIAnalysis, WorkflowTemplate } from '@/types/workflow';
import { workflowMatcher } from '@/lib/workflow-matcher';
import { expressionParser } from '@/lib/expression-parser';
import { aiOrchestrator } from '@/lib/ai-orchestrator';
import { getModelForTask, getMaxTokensForModel } from '@/lib/ai-models';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, templates, context } = await req.json();

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
    let personalizedSuggestions: string[] = [];

    try {
      // PRIMARY: Try AI Orchestrator for intelligent processing
      if (context?.userHistory) {
        aiOrchestrator.updateContext({ userHistory: context.userHistory });
      }

      orchestrationPlan = await aiOrchestrator.orchestrateRequest(message, templates || []);

      // Execute orchestrated actions
      for (const action of orchestrationPlan.suggestedActions) {
        switch (action.type) {
          case 'search_workflows':
            suggestions = workflowMatcher.findMatches(message, {
              intent: orchestrationPlan.intent as any,
              confidence: orchestrationPlan.confidence,
              extractedNumbers: [],
              extractedOperations: [],
              variables: [],
              suggestedAction: action.reasoning
            });
            
            // Auto-load high confidence matches
            if (suggestions.length > 0 && orchestrationPlan.intent === 'find') {
              const bestMatch = suggestions[0];
              if (bestMatch.confidence > 0.8 && templates) {
                foundWorkflow = templates.find((t: WorkflowTemplate) => t.id === bestMatch.workflowId) || null;
              }
            }
            break;

          case 'create_workflow':
            const createResult = await handleIntelligentWorkflowCreation(message, orchestrationPlan);
            if (createResult.workflow) {
              createdWorkflow = createResult.workflow;
            }
            break;
        }
      }

      // Generate intelligent response
      response = await generateIntelligentResponse(message, orchestrationPlan, suggestions, createdWorkflow, foundWorkflow);

      // Get personalized suggestions
      personalizedSuggestions = await aiOrchestrator.getPersonalizedSuggestions();

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
      personalizedSuggestions,
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
  const systemPrompt = `You are an AI assistant that analyzes user messages about mathematical workflows and expressions.

Analyze the user's message and extract:
1. Intent: 'find_workflow', 'create_workflow', 'execute_workflow', 'explain', or 'general'
2. Mathematical expression if present
3. Numbers mentioned
4. Operations mentioned (addition, subtraction, multiplication, division, etc.)
5. Variables mentioned (x, y, z, etc.)
6. Confidence level (0-1)
7. Suggested action

Respond ONLY with a JSON object in this exact format:
{
  "intent": "find_workflow|create_workflow|execute_workflow|explain|general",
  "expression": "mathematical expression if present",
  "extractedNumbers": [array of numbers],
  "extractedOperations": [array of operations],
  "variables": [array of variable names],
  "confidence": 0.0-1.0,
  "suggestedAction": "brief description of what should be done"
}

Examples:
- "I need to calculate 3 + 5" -> intent: "execute_workflow"
- "Create a workflow for x + y - z" -> intent: "create_workflow"
- "What workflow do I need for addition?" -> intent: "find_workflow"
- "How does multiplication work?" -> intent: "explain"`;

  // Try multiple models with fallback
  const models = [
    { id: getModelForTask('analysis'), desc: 'primary analysis' },
    { id: getModelForTask('simple'), desc: 'fallback simple' },
    { id: getModelForTask('fallback'), desc: 'fallback reliable' }
  ];

  for (const modelInfo of models) {
    try {
      const maxTokens = getMaxTokensForModel(modelInfo.id);
      
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: modelInfo.id,
        temperature: 0.1,
        max_tokens: Math.min(maxTokens, 500)
      });

      const analysisText = completion.choices[0]?.message?.content || '{}';
      console.log(`AI response from ${modelInfo.desc} model (${modelInfo.id}):`, analysisText);

      let analysis;
      try {
        // Try to extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : analysisText;
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error(`JSON parse error with ${modelInfo.desc} model:`, parseError);
        continue; // Try next model
      }

      return {
        intent: analysis.intent || 'general',
        expression: analysis.expression,
        extractedNumbers: analysis.extractedNumbers || [],
        extractedOperations: analysis.extractedOperations || [],
        variables: analysis.variables || [],
        confidence: analysis.confidence || 0.5,
        suggestedAction: analysis.suggestedAction || 'Process the request'
      };

    } catch (error) {
      console.error(`AI analysis failed with ${modelInfo.desc} model (${modelInfo.id}):`, error);
      if (modelInfo === models[models.length - 1]) {
        // This was the last model, fallback to manual analysis
        console.error('All AI models failed, using fallback analysis');
        return createFallbackAnalysis(message);
      }
      // Try next model
      continue;
    }
  }

  // Fallback analysis (should not reach here, but just in case)
  return createFallbackAnalysis(message);
}

function createFallbackAnalysis(message: string): AIAnalysis {
  const lowerMessage = message.toLowerCase();

  // Extract numbers
  const numbers = message.match(/\d+(\.\d+)?/g)?.map(Number) || [];

  // Extract operations
  const operations = [];
  if (lowerMessage.includes('+') || lowerMessage.includes('add')) operations.push('addition');
  if (lowerMessage.includes('-') || lowerMessage.includes('subtract')) operations.push('subtraction');
  if (lowerMessage.includes('*') || lowerMessage.includes('multiply')) operations.push('multiplication');
  if (lowerMessage.includes('/') || lowerMessage.includes('divide')) operations.push('division');

  // Determine intent
  let intent = 'general';
  if (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('make')) {
    intent = 'create_workflow';
  } else if (lowerMessage.includes('find') || lowerMessage.includes('need') || lowerMessage.includes('which')) {
    intent = 'find_workflow';
  } else if (lowerMessage.includes('calculate') || lowerMessage.includes('compute') || numbers.length > 0) {
    intent = 'execute_workflow';
  } else if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    intent = 'explain';
  }

  return {
    intent: intent as any,
    expression: message.match(/[\d\+\-\*\/\(\)\s]+/) ? message.match(/[\d\+\-\*\/\(\)\s]+/)?.[0] : undefined,
    extractedNumbers: numbers,
    extractedOperations: operations as any,
    variables: message.match(/\b[a-z]\b/gi) || [],
    confidence: 0.6,
    suggestedAction: 'Process the request with fallback analysis'
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
    "🔍 **Find workflows**: 'What workflow do I need for addition?'\n" +
    "🏗️ **Create workflows**: 'Build a workflow for 3 + 5 * 2'\n" +
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
    const fallbackAnalysis = createFallbackAnalysis(message);
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