'use client';

import { useEffect } from 'react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowBuilder } from './WorkflowBuilder/WorkflowBuilder';
import { Chatbot } from './Chatbot/Chatbot';
import { defaultWorkflowTemplates } from '@/data/workflow-templates';

export function WorkflowOrchestrator() {
  const { templates, addTemplate } = useWorkflowStore();

  // Initialize with default templates
  useEffect(() => {
    if (templates.length === 0) {
      defaultWorkflowTemplates.forEach(template => {
        addTemplate(template);
      });
    }
  }, [templates.length, addTemplate]);

  return (
    <div className="flex h-screen bg-gray-50" style={{ color: '#111827' }}>
      {/* Left Panel - Workflow Builder */}
      <div className="w-2/3 bg-white border-r border-gray-200 flex flex-col workflow-builder">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900" style={{ color: '#111827' }}>Mathematical Workflow Orchestrator</h1>
          <p className="text-sm text-gray-600 mt-1" style={{ color: '#4b5563' }}>
            Build, visualize, and orchestrate intelligent mathematical workflows
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <WorkflowBuilder />
        </div>
      </div>

      {/* Right Panel - AI Chatbot */}
      <div className="w-1/3 bg-gray-50 flex flex-col chat-component">
        <div className="border-b border-gray-200 px-6 py-4 bg-white">
          <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#111827' }}>AI Assistant</h2>
          <p className="text-sm text-gray-600 mt-1" style={{ color: '#4b5563' }}>
            Ask me to find workflows or create new ones
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}