'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { ChatMessage } from '@/types/workflow';

export function Chatbot() {
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    templates,
    addTemplate,
    loadTemplate,
  } = useWorkflowStore();

  const [input, setInput] = useState('');
  const [orchestrationSteps, setOrchestrationSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your intelligent workflow orchestrator. I can help you:\n\n🔍 **Find workflows**: \"Find the workflow which is adding 4 with 7?\"\n🏗️ **Create workflows**: \"Create a workflow for 3 + 5 * 2\"\n▶️ **Execute calculations**: \"Calculate 10 + 15 - 8\"\n❓ **Explain concepts**: \"How does the workflow system work?\"\n\nWhat would you like to do?",
        timestamp: new Date(),
      };
      addMessage(welcomeMessage);
    }
  }, [messages.length, addMessage]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);

    // Set orchestration steps
    const steps = [
      '🤖 Analyzing request with AI Orchestrator...',
      '🔍 Performing deep analysis of mathematical concepts...',
      '🎯 Determining intent and confidence level...',
      '⚙️ Creating orchestration plan...',
      '📊 Coordinating multiple AI tools...',
      '🔄 Processing workflow actions...',
      '✨ Generating intelligent response...'
    ];
    
    setOrchestrationSteps(steps);
    setCurrentStep(0);

    // Simulate orchestration steps progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 800); // Change step every 800ms

    try {
      // Get fresh templates from store to avoid stale closure issues
      const currentTemplates = useWorkflowStore.getState().templates;
      
      // Debug: Log current templates being sent to API
      console.log('🔍 CHATBOT DEBUG: Templates being sent to API:', currentTemplates.length);
      console.log('🔍 CHATBOT DEBUG: User-created workflows:', currentTemplates.filter(t => t.tags.includes('user-created')).length);
      console.log('🔍 CHATBOT DEBUG: Message intent keywords check:');
      console.log('  - Contains "create workflow":', input.toLowerCase().includes('create workflow'));
      console.log('  - Contains "create a workflow":', input.toLowerCase().includes('create a workflow'));
      console.log('  - Contains "get me the workflow":', input.toLowerCase().includes('get me the workflow'));
      console.log('  - Contains "from templates":', input.toLowerCase().includes('from templates'));
      console.log('  - Raw numbers extracted:', input.match(/\b\d+(?:\.\d+)?\b/g));
      console.log('🔍 CHATBOT DEBUG: User message:', input.trim());
      
      // Use new Vercel AI SDK endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          templates: currentTemplates, // Use fresh templates from store
          context: {
            currentWorkflow: useWorkflowStore.getState().activeWorkflow,
            recentMessages: messages.slice(-5),
            userHistory: messages.filter(m => m.role === 'user').map(m => m.content).slice(-10),
          },
        }),
      });

      clearInterval(stepInterval); // Clear interval when response is received

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response with enhanced orchestration data
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        workflowSuggestions: data.suggestions,
        createdWorkflow: data.createdWorkflow?.id || null, // Store only the ID for the message
        createdWorkflowName: data.createdWorkflow?.name || null, // Store name for display
        orchestration: data.orchestration,
        fallbackAnalysis: data.analysis, // Include fallback analysis data
      };

      addMessage(assistantMessage);

      // If a matching workflow was found, auto-load it
      if (data.foundWorkflow) {
        console.log('Auto-loading found workflow:', data.foundWorkflow);
        loadTemplate(data.foundWorkflow);
      }

      // If a workflow was created, add it to templates and load it
      if (data.createdWorkflow) {
        addTemplate(data.createdWorkflow); // data.createdWorkflow is the full WorkflowTemplate object
        loadTemplate(data.createdWorkflow);
      }

      // Log orchestration data for debugging
      if (data.orchestration) {
        console.log('🤖 AI Orchestration Results:', {
          intent: data.orchestration.intent,
          confidence: data.orchestration.confidence,
          reasoning: data.orchestration.reasoning,
          actions: data.orchestration.suggestedActions.length
        });
      } else if (data.analysis) {
        console.log('⚙️ Fallback Analysis Used:', {
          intent: data.analysis.intent,
          confidence: data.analysis.confidence,
          mode: 'manual_fallback'
        });
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
      setOrchestrationSteps([]);
      setCurrentStep(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

    const loadSuggestedWorkflow = (workflowId: string) => {
    const workflow = templates.find(t => t.id === workflowId);
    if (workflow) {
      loadTemplate(workflow);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[280px] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, index) => {
                  // Parse markdown in the line
                  const parseMarkdown = (text: string) => {
                    // Handle bold text **text**
                    let parsed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    // Handle headers
                    if (text.startsWith('# ')) {
                      return <h3 className="font-bold text-lg mb-2">{text.slice(2)}</h3>;
                    }
                    // Handle list items
                    if (text.startsWith('- ') || text.startsWith('• ')) {
                      return <div className="ml-4" dangerouslySetInnerHTML={{ __html: parsed }} />;
                    }
                    // Handle regular text with bold formatting
                    return <div dangerouslySetInnerHTML={{ __html: parsed }} />;
                  };

                  return line ? (
                    <div key={index}>{parseMarkdown(line)}</div>
                  ) : (
                    <div key={index} className="h-2" />
                  );
                })}
              </div>

              {/* AI Orchestration Info */}
              {message.orchestration && message.role === 'assistant' && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🤖</span>
                    </div>
                    <div className="text-sm font-semibold text-purple-800">
                      AI Orchestration Active
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-purple-600 font-medium">Intent:</span>
                      <span className="ml-1 text-purple-800 capitalize">{message.orchestration.intent}</span>
                    </div>
                    <div>
                      <span className="text-purple-600 font-medium">Confidence:</span>
                      <span className="ml-1 text-purple-800">{(message.orchestration.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-purple-600 font-medium">Actions:</span>
                      <span className="ml-1 text-purple-800">{message.orchestration.suggestedActions.length} coordinated</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback Analysis Info */}
              {message.fallbackAnalysis && !message.orchestration && message.role === 'assistant' && (
                <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">⚙️</span>
                    </div>
                    <div className="text-sm font-semibold text-orange-800">
                      Manual Analysis (AI Fallback)
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-orange-600 font-medium">Intent:</span>
                      <span className="ml-1 text-orange-800 capitalize">{message.fallbackAnalysis.intent}</span>
                    </div>
                    <div>
                      <span className="text-orange-600 font-medium">Confidence:</span>
                      <span className="ml-1 text-orange-800">{(message.fallbackAnalysis.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-orange-600 font-medium">Mode:</span>
                      <span className="ml-1 text-orange-800">Traditional pattern matching</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow Suggestions */}
              {message.workflowSuggestions && message.workflowSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-semibold text-gray-700">
                    Suggested Workflows:
                  </div>
                  {message.workflowSuggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.workflowId}
                      onClick={() => loadSuggestedWorkflow(suggestion.workflowId)}
                      className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border text-sm transition-colors"
                    >
                      <div className="font-medium text-blue-800">
                        {suggestion.name}
                      </div>
                      <div className="text-blue-600 text-xs">
                        {(suggestion.confidence * 100).toFixed(1)}% match • {suggestion.reason}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Created Workflow Indicator */}
              {message.createdWorkflow && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <div className="font-medium text-green-800">
                    ✅ Workflow Created!
                  </div>
                  <div className="text-green-600 text-xs">
                    "{message.createdWorkflowName || 'New Workflow'}" has been added to your library
                  </div>
                </div>
              )}

              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator with orchestration steps */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 min-w-[300px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">AI Orchestration Process</span>
                </div>
                
                {/* Orchestration Steps */}
                <div className="space-y-1">
                  {orchestrationSteps.map((step, index) => (
                    <div 
                      key={index}
                      className={`text-xs flex items-center gap-2 transition-all duration-300 ${
                        index <= currentStep 
                          ? 'text-blue-600 font-medium' 
                          : 'text-gray-400'
                      }`}
                    >
                      {index < currentStep ? (
                        <span className="text-green-500">✅</span>
                      ) : index === currentStep ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                      ) : (
                        <span className="text-gray-300">⏳</span>
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to find or create workflows..."
            className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Try: "Create workflow for 3 + 5 * 2" or "Find addition workflow"
        </div>
      </div>
    </div>
  );
}