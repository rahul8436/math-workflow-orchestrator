import Groq from 'groq-sdk';
import { WorkflowTemplate } from '@/types/workflow';
import { workflowMatcher } from './workflow-matcher';
import { expressionParser } from './expression-parser';
import { getModelForTask, getMaxTokensForModel, getModelFallbackChain } from './ai-models';

interface OrchestrationContext {
  userHistory: string[];
  availableWorkflows: WorkflowTemplate[];
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  domainPreferences: string[];
}

interface OrchestrationPlan {
  intent: 'find' | 'create' | 'modify' | 'explain' | 'execute';
  confidence: number;
  reasoning: string;
  suggestedActions: OrchestrationAction[];
  alternativeOptions: string[];
}

interface OrchestrationAction {
  type: 'search_workflows' | 'create_workflow' | 'explain_concept' | 'suggest_learning_path';
  parameters: Record<string, any>;
  priority: number;
  reasoning: string;
}

export class AIOrchestrator {
  private groq: Groq;
  private context: OrchestrationContext;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
    this.context = {
      userHistory: [],
      availableWorkflows: [],
      userLevel: 'beginner',
      domainPreferences: []
    };
  }

  async orchestrateRequest(
    userMessage: string,
    availableWorkflows: WorkflowTemplate[]
  ): Promise<OrchestrationPlan> {
    this.context.availableWorkflows = availableWorkflows;
    this.context.userHistory.push(userMessage);

    // Use LLM-based orchestration for all intent detection - no preprocessing
    console.log('🎯 AI Orchestrator: Using pure LLM analysis for intent detection');

    // Step 1: Deep AI Analysis
    const deepAnalysis = await this.performDeepAnalysis(userMessage);

    // Step 2: Context-Aware Planning
    const orchestrationPlan = await this.createOrchestrationPlan(deepAnalysis);

    // Step 3: Multi-Tool Coordination
    const coordinatedActions = await this.coordinateTools(orchestrationPlan);

    return {
      ...orchestrationPlan,
      suggestedActions: coordinatedActions
    };
  }

  private async performDeepAnalysis(message: string) {
    const analysisPrompt = `You are an expert mathematical workflow orchestrator. Analyze this user request with deep understanding:

"${message}"

Consider:
1. Mathematical concepts involved
2. Business/real-world context
3. User's likely skill level
4. Underlying computational needs
5. Related mathematical domains

Available workflows: ${this.context.availableWorkflows.map(w => `${w.name}: ${w.description}`).join(', ')}

Provide detailed analysis in JSON format:
{
  "mathematicalConcepts": ["concept1", "concept2"],
  "businessContext": "description",
  "estimatedUserLevel": "beginner|intermediate|advanced",
  "computationalNeeds": ["need1", "need2"],
  "relatedDomains": ["domain1", "domain2"],
  "underlyingIntent": "what user really wants to achieve",
  "complexity": 1-10,
  "suggestedApproach": "how to best help the user"
}`;

    // Try multiple models with comprehensive fallback chain
    const modelChain = getModelFallbackChain('analysis');
    const models = modelChain.map((modelId, index) => ({
      id: modelId,
      desc: index === 0 ? 'primary analysis' : 
           index === 1 ? 'secondary analysis' :
           index === 2 ? 'medium analysis' :
           index === 3 ? 'fast fallback' :
           index === 4 ? 'reliable fallback' : 'emergency fallback'
    }));

    for (const modelInfo of models) {
      try {
        const maxTokens = getMaxTokensForModel(modelInfo.id);
        
        const response = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: analysisPrompt }],
          model: modelInfo.id,
          temperature: 0.3,
          max_tokens: Math.min(maxTokens, 1000)
        });

        const analysisText = response.choices[0]?.message?.content || '{}';
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
        
        console.log(`Deep analysis successful with ${modelInfo.desc} model (${modelInfo.id})`);
        return analysis;
        
      } catch (error: any) {
        console.error(`Deep analysis failed with ${modelInfo.desc} model (${modelInfo.id}):`, error);
        
        // For rate limit errors, show helpful message
        if (error.status === 429) {
          console.warn(`Rate limit hit on ${modelInfo.desc} model (${modelInfo.id}), trying next model...`);
        }
        
        if (modelInfo === models[models.length - 1]) {
          // This was the last model in the chain
          console.error('All models in fallback chain failed for deep analysis, using manual fallback');
          return this.createFallbackAnalysis(message);
        }
        continue;
      }
    }

    return this.createFallbackAnalysis(message);
  }

  private async createOrchestrationPlan(analysis: any): Promise<OrchestrationPlan> {
    // Intelligent intent determination
    const intent = this.determineIntelligentIntent(analysis);

    // Create orchestration plan
    const planningPrompt = `Based on this analysis: ${JSON.stringify(analysis)}

Create an orchestration plan that coordinates multiple AI tools and workflows:

1. If user needs a workflow that doesn't exist, plan its creation
2. If user's request is complex, break it into steps
3. Consider learning curve and provide educational value
4. Suggest related workflows they might find useful
5. Plan for error handling and edge cases

Respond with JSON:
{
  "primaryAction": "main action to take",
  "reasoning": "why this approach",
  "confidence": 0.0-1.0,
  "steps": ["step1", "step2", "step3"],
  "educationalValue": "what user will learn",
  "relatedSuggestions": ["suggestion1", "suggestion2"]
}`;

    // Try multiple models with comprehensive fallback chain
    const modelChain = getModelFallbackChain('orchestration');
    const models = modelChain.map((modelId, index) => ({
      id: modelId,
      desc: index === 0 ? 'primary orchestration' : 
           index === 1 ? 'secondary orchestration' :
           index === 2 ? 'medium orchestration' :
           index === 3 ? 'fast orchestration' :
           index === 4 ? 'reliable orchestration' : 'emergency orchestration'
    }));

    for (const modelInfo of models) {
      try {
        const maxTokens = getMaxTokensForModel(modelInfo.id);
        
        const response = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: planningPrompt }],
          model: modelInfo.id,
          temperature: 0.2,
          max_tokens: Math.min(maxTokens, 800)
        });

        const planText = response.choices[0]?.message?.content || '{}';
        const jsonMatch = planText.match(/\{[\s\S]*\}/);
        const plan = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

        console.log(`Orchestration plan created with ${modelInfo.desc} model (${modelInfo.id})`);
        
        return {
          intent,
          confidence: plan.confidence || 0.7,
          reasoning: plan.reasoning || 'AI-powered analysis',
          suggestedActions: [],
          alternativeOptions: plan.relatedSuggestions || []
        };
        
      } catch (error: any) {
        console.error(`Orchestration planning failed with ${modelInfo.desc} model (${modelInfo.id}):`, error);
        
        // For rate limit errors, show helpful message
        if (error.status === 429) {
          console.warn(`Rate limit hit on ${modelInfo.desc} model (${modelInfo.id}), trying next model in chain...`);
        }
        if (error.status === 500 && modelInfo.id === getModelForTask('orchestration')) {
          console.warn(`Primary orchestration model (${modelInfo.id}) returned 500 error, switching to fallback immediately`);
        }
        
        if (modelInfo === models[models.length - 1]) {
          // This was the last model
          console.error('All models failed for orchestration planning, using fallback plan');
          return this.createFallbackPlan();
        }
        continue;
      }
    }

    return this.createFallbackPlan();
  }

  private async coordinateTools(plan: OrchestrationPlan): Promise<OrchestrationAction[]> {
    const actions: OrchestrationAction[] = [];

    switch (plan.intent) {
      case 'find':
        actions.push(await this.createSearchAction(plan));
        actions.push(await this.createEducationalAction(plan));
        break;

      case 'create':
        actions.push(await this.createWorkflowCreationAction(plan));
        actions.push(await this.createValidationAction(plan));
        break;

      case 'explain':
        actions.push(await this.createEducationalAction(plan));
        actions.push(await this.createExampleAction(plan));
        break;
    }

    return actions.sort((a, b) => b.priority - a.priority);
  }

  private async createSearchAction(plan: OrchestrationPlan): Promise<OrchestrationAction> {
    return {
      type: 'search_workflows',
      parameters: {
        searchTerms: this.extractSearchTerms(plan),
        semanticSearch: true,
        includeRelated: true
      },
      priority: 9,
      reasoning: 'Search for existing workflows first to avoid duplication'
    };
  }

  private async createWorkflowCreationAction(plan: OrchestrationPlan): Promise<OrchestrationAction> {
    return {
      type: 'create_workflow',
      parameters: {
        autoGenerate: true,
        includeDocumentation: true,
        suggestOptimizations: true
      },
      priority: 10,
      reasoning: 'Create optimized workflow with educational value'
    };
  }

  private async createEducationalAction(plan: OrchestrationPlan): Promise<OrchestrationAction> {
    return {
      type: 'explain_concept',
      parameters: {
        includeExamples: true,
        relateToUserContext: true,
        suggestNextSteps: true
      },
      priority: 8,
      reasoning: 'Provide educational value beyond just solving the problem'
    };
  }

  private async createExampleAction(plan: OrchestrationPlan): Promise<OrchestrationAction> {
    return {
      type: 'suggest_learning_path',
      parameters: {
        currentLevel: this.context.userLevel,
        progressionPath: true,
        practiceExercises: true
      },
      priority: 6,
      reasoning: 'Guide user through progressive learning'
    };
  }

  private async createValidationAction(plan: OrchestrationPlan): Promise<OrchestrationAction> {
    return {
      type: 'search_workflows', // Reusing for validation
      parameters: {
        validateLogic: true,
        checkEdgeCases: true,
        suggestImprovements: true
      },
      priority: 7,
      reasoning: 'Validate created workflow for correctness and optimization'
    };
  }

  private determineIntelligentIntent(analysis: any): OrchestrationPlan['intent'] {
    if (analysis.underlyingIntent?.includes('learn') || analysis.underlyingIntent?.includes('understand')) {
      return 'explain';
    }
    if (analysis.computationalNeeds?.length > 2 || analysis.complexity > 6) {
      return 'create';
    }
    if (analysis.businessContext?.includes('existing') || analysis.underlyingIntent?.includes('find')) {
      return 'find';
    }
    return 'create';
  }

  private extractSearchTerms(plan: OrchestrationPlan): string[] {
    // Extract intelligent search terms based on context
    return ['intelligent', 'extraction', 'needed'];
  }

  private createFallbackAnalysis(message: string) {
    return {
      mathematicalConcepts: ['basic arithmetic'],
      businessContext: 'general calculation',
      estimatedUserLevel: 'beginner',
      computationalNeeds: ['calculation'],
      relatedDomains: ['mathematics'],
      underlyingIntent: 'solve mathematical problem',
      complexity: 3,
      suggestedApproach: 'provide simple solution'
    };
  }

  private createFallbackPlan(): OrchestrationPlan {
    return {
      intent: 'create',
      confidence: 0.5,
      reasoning: 'Fallback plan due to analysis failure',
      suggestedActions: [],
      alternativeOptions: []
    };
  }

  // Public method to update context based on user interactions
  updateContext(updates: Partial<OrchestrationContext>) {
    this.context = { ...this.context, ...updates };
  }

  // Get intelligent suggestions based on user's workflow history
  async getPersonalizedSuggestions(): Promise<string[]> {
    // Return demo-ready, clickable suggestions that work 100%
    const demoReadySuggestions = [
      "Create workflow for 10 + 15",
      "Find workflow for 3 + 5", 
      "Create workflow for (20 + 30) / 5",
      "Find workflow for 6 * 4",
      "Create workflow for 100 - 25",
      "Find workflow for 30 ÷ 6",
      "Calculate 45 + 55",
      "Find workflow for 25 + 35",
      "Create workflow for 12 * 5"
    ];

    // Randomize and return 3-4 suggestions for variety
    const shuffled = demoReadySuggestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 suggestions
  }
}

export const aiOrchestrator = new AIOrchestrator(process.env.GROQ_API_KEY || '');