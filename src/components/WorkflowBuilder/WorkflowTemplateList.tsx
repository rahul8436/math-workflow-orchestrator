'use client';

import { useState } from 'react';
import { Search, Play, Trash2, Star, Clock, Hash, Plus } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowTemplate } from '@/types/workflow';
import { WorkflowCreator } from './WorkflowCreator';

export function WorkflowTemplateList() {
  const {
    templates,
    loadTemplate,
    removeTemplate,
    searchWorkflows,
    getPopularWorkflows,
    activeWorkflow,
  } = useWorkflowStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'popular' | 'recent' | 'basic' | 'complex'>('all');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const getFilteredTemplates = () => {
    let filtered = searchQuery
      ? searchWorkflows(searchQuery)
      : templates;

    switch (filter) {
      case 'popular':
        return getPopularWorkflows();
      case 'recent':
        return filtered.sort((a, b) =>
          new Date(b.lastUsed || b.createdAt).getTime() -
          new Date(a.lastUsed || a.createdAt).getTime()
        );
      case 'basic':
        return filtered.filter(t => t.complexity === 'basic');
      case 'complex':
        return filtered.filter(t => ['advanced', 'complex'].includes(t.complexity));
      default:
        return filtered.sort((a, b) => b.usageCount - a.usageCount);
    }
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    console.log('🎯 Loading template:', template.name, 'ID:', template.id);
    console.log('📊 Template nodes:', template.nodes.length, 'edges:', template.edges.length);
    loadTemplate(template);
  };

  const handleDeleteTemplate = (template: WorkflowTemplate, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Delete workflow "${template.name}"?`)) {
      removeTemplate(template.id);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-blue-600 bg-blue-50';
      case 'advanced': return 'text-orange-600 bg-orange-50';
      case 'complex': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="h-full flex flex-col template-list" style={{ color: '#111827' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white" style={{ color: '#111827' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Workflow Templates
          </h2>
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'All', icon: Hash },
            { key: 'popular', label: 'Popular', icon: Star },
            { key: 'recent', label: 'Recent', icon: Clock },
            { key: 'basic', label: 'Basic', icon: null },
            { key: 'complex', label: 'Complex', icon: null },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption.icon && (
                <filterOption.icon className="inline w-3 h-3 mr-1" />
              )}
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery ? 'No workflows found' : 'No workflows available'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleLoadTemplate(template)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group workflow-template-item ${
                  activeWorkflow?.id === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{ color: '#111827' }}
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => handleLoadTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Load workflow"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    {!template.id.startsWith('basic-') && (
                      <button
                        onClick={(e) => handleDeleteTemplate(template, e)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Pattern */}
                <div className="mb-2">
                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {template.pattern}
                  </code>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full font-medium ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </span>
                    <span className="text-gray-500">
                      {template.operations.length} ops
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    {template.usageCount > 0 && (
                      <span>{template.usageCount} uses</span>
                    )}
                    <span>{template.operandCount} inputs</span>
                  </div>
                </div>

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        +{template.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {templates.length} workflows • {filteredTemplates.length} shown
        </div>
      </div>

      {/* Workflow Creator Modal */}
      <WorkflowCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
      />
    </div>
  );
}