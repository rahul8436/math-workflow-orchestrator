import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WorkflowTemplate, WorkflowNode, WorkflowEdge, ChatMessage, WorkflowExecution } from '@/types/workflow';

interface WorkflowStore {
  // Workflow Templates
  templates: WorkflowTemplate[];
  activeWorkflow: WorkflowTemplate | null;

  // Current Workflow Builder State
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Chat State
  messages: ChatMessage[];
  isLoading: boolean;

  // Execution State
  executions: WorkflowExecution[];
  currentExecution: WorkflowExecution | null;

  // Actions - Templates
  addTemplate: (template: WorkflowTemplate) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<WorkflowTemplate>) => void;
  setActiveWorkflow: (workflow: WorkflowTemplate | null) => void;
  loadTemplate: (template: WorkflowTemplate) => void;

  // Actions - Workflow Builder
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (id: string) => void;
  clearWorkflow: () => void;

  // Actions - Chat
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // Actions - Execution
  addExecution: (execution: WorkflowExecution) => void;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;

  // Intelligence Functions
  findMatchingWorkflows: (pattern: string) => WorkflowTemplate[];
  incrementUsage: (workflowId: string) => void;
  getPopularWorkflows: () => WorkflowTemplate[];
  searchWorkflows: (query: string) => WorkflowTemplate[];
}

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    templates: [],
    activeWorkflow: null,
    nodes: [],
    edges: [],
    messages: [],
    isLoading: false,
    executions: [],
    currentExecution: null,

    // Template Actions
    addTemplate: (template) =>
      set((state) => ({
        templates: [...state.templates, template]
      })),

    removeTemplate: (id) =>
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id)
      })),

    updateTemplate: (id, updates) =>
      set((state) => ({
        templates: state.templates.map(t =>
          t.id === id ? { ...t, ...updates } : t
        )
      })),

    setActiveWorkflow: (workflow) =>
      set({ activeWorkflow: workflow }),

    loadTemplate: (template) => {
      console.log('📦 Store: Loading template', template.name, 'with', template.nodes.length, 'nodes');
      
      // Clear any previous execution state
      set({
        activeWorkflow: template,
        nodes: template.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            // Reset all node values to their template defaults
            value: node.type === 'result' ? undefined : (node.data.value ?? 0)
          }
        })),
        edges: template.edges,
        currentExecution: null, // Clear previous execution
        executions: [] // Clear execution history for clean state
      });
      
      console.log('✅ Store: Template loaded, active workflow:', get().activeWorkflow?.name, 'nodes:', get().nodes.length);
      get().incrementUsage(template.id);
    },

    // Workflow Builder Actions
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    addNode: (node) =>
      set((state) => ({
        nodes: [...state.nodes, node]
      })),

    updateNode: (id, updates) =>
      set((state) => ({
        nodes: state.nodes.map(n =>
          n.id === id ? { ...n, ...updates } : n
        )
      })),

    removeNode: (id) =>
      set((state) => ({
        nodes: state.nodes.filter(n => n.id !== id),
        edges: state.edges.filter(e => e.source !== id && e.target !== id)
      })),

    addEdge: (edge) =>
      set((state) => ({
        edges: [...state.edges, edge]
      })),

    removeEdge: (id) =>
      set((state) => ({
        edges: state.edges.filter(e => e.id !== id)
      })),

    clearWorkflow: () =>
      set({
        nodes: [],
        edges: [],
        activeWorkflow: null
      }),

    // Chat Actions
    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message]
      })),

    setLoading: (loading) => set({ isLoading: loading }),

    clearMessages: () => set({ messages: [] }),

    // Execution Actions
    addExecution: (execution) =>
      set((state) => ({
        executions: [...state.executions, execution]
      })),

    setCurrentExecution: (execution) =>
      set({ currentExecution: execution }),

    // Intelligence Functions
    findMatchingWorkflows: (pattern) => {
      const { templates } = get();
      const normalizedPattern = pattern.toLowerCase().trim();

      return templates.filter(template => {
        // Exact pattern match
        if (template.pattern.toLowerCase() === normalizedPattern) return true;

        // Tag matches
        if (template.tags.some(tag =>
          normalizedPattern.includes(tag.toLowerCase())
        )) return true;

        // Description match
        if (template.description.toLowerCase().includes(normalizedPattern)) return true;

        // Example matches
        if (template.examples.some(example =>
          example.toLowerCase().includes(normalizedPattern)
        )) return true;

        return false;
      }).sort((a, b) => b.usageCount - a.usageCount); // Sort by popularity
    },

    incrementUsage: (workflowId) => {
      set((state) => ({
        templates: state.templates.map(t =>
          t.id === workflowId
            ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date() }
            : t
        )
      }));
    },

    getPopularWorkflows: () => {
      const { templates } = get();
      return [...templates]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);
    },

    searchWorkflows: (query) => {
      const { templates } = get();
      const normalizedQuery = query.toLowerCase().trim();

      if (!normalizedQuery) return templates;

      return templates.filter(template =>
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery) ||
        template.pattern.toLowerCase().includes(normalizedQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
      );
    }
  }))
);