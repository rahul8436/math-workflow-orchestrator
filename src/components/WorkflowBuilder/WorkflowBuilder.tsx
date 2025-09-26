'use client';

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowNode as WorkflowNodeType } from '@/types/workflow';
import { WorkflowTemplateList } from './WorkflowTemplateList';
import { WorkflowControls } from './WorkflowControls';
import { OperandNode } from './nodes/OperandNode';
import { OperatorNode } from './nodes/OperatorNode';
import { ResultNode } from './nodes/ResultNode';
import { VariableNode } from './nodes/VariableNode';

const nodeTypes = {
  operand: OperandNode,
  operator: OperatorNode,
  result: ResultNode,
  variable: VariableNode,
};

export function WorkflowBuilder() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    activeWorkflow,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const syncInProgress = useRef(false);

  // Expose function to update result nodes directly
  useEffect(() => {
    (window as any).updateWorkflowResult = (result: number) => {
      console.log('🎯 Direct result update called with:', result);
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.type === 'result') {
            console.log('📊 Updating result node:', node.id, 'with value:', result);
            return {
              ...node,
              data: {
                ...node.data,
                value: result
              }
            };
          }
          return node;
        })
      );
    };

    return () => {
      delete (window as any).updateWorkflowResult;
    };
  }, [setNodes]);

  // Sync with store - properly update when templates change
  useEffect(() => {
    console.log('🔄 Syncing with store - activeWorkflow:', activeWorkflow?.name, 'storeNodes:', storeNodes.length);
    
    if (storeNodes.length > 0) {
      const reactFlowNodes = storeNodes.map(convertToReactFlowNode);
      const reactFlowEdges = storeEdges.map(convertToReactFlowEdge);

      console.log('📊 Setting ReactFlow nodes:', reactFlowNodes.length, 'edges:', reactFlowEdges.length);
      
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
      
      // Fit view after a short delay to ensure nodes are rendered
      setTimeout(() => {
        console.log('🔍 Fitting view to new template');
      }, 100);
    } else {
      // Clear canvas when no nodes
      console.log('🧹 Clearing canvas - no store nodes');
      setNodes([]);
      setEdges([]);
    }
  }, [activeWorkflow?.id, storeNodes.length, storeEdges.length, setNodes, setEdges]);

  // Additional effect to handle deep changes in store nodes
  useEffect(() => {
    if (storeNodes.length > 0 && activeWorkflow) {
      const storeNodeIds = storeNodes.map(n => n.id).sort().join(',');
      const currentNodeIds = nodes.map(n => n.id).sort().join(',');
      
      if (storeNodeIds !== currentNodeIds) {
        console.log('🔄 Node structure changed, forcing sync');
        const reactFlowNodes = storeNodes.map(convertToReactFlowNode);
        const reactFlowEdges = storeEdges.map(convertToReactFlowEdge);
        
        setNodes(reactFlowNodes);
        setEdges(reactFlowEdges);
      }
    }
  }, [storeNodes, storeEdges, activeWorkflow, nodes, setNodes, setEdges]);


  // Update store when nodes/edges change - simplified to avoid conflicts
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Don't update store immediately during drag to avoid flickering
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);

    // Update the store with the latest edge changes
    setTimeout(() => {
      const currentEdges = edges.map(convertToWorkflowEdge);
      setStoreEdges(currentEdges);
    }, 0);
  }, [onEdgesChange, edges, setStoreEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = addEdge(params, edges);
      setEdges(newEdge);

      // Update store
      const storeEdge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
      };
      setStoreEdges([...storeEdges, storeEdge]);
    },
    [edges, setEdges, storeEdges, setStoreEdges]
  );

  const onNodeDragStop = useCallback((_event: any, node: Node) => {
    // Only update store when drag completely stops
    setTimeout(() => {
      const currentNodes = nodes.map(convertToWorkflowNode);
      setStoreNodes(currentNodes);
    }, 100);
  }, [nodes, setStoreNodes]);

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Templates - Made smaller */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
        <WorkflowTemplateList />
      </div>

      {/* Main Workflow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2, // Reduced padding for tighter fit
            includeHiddenNodes: true,
            minZoom: 0.3,  // Allow zooming out more for better overview
            maxZoom: 2
          }}
          minZoom={0.2}  // Reduced minimum zoom
          maxZoom={2.5}  // Increased maximum zoom for detail work
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }} // Better default zoom for smaller nodes
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={[1, 2]}
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'operand': return '#3B82F6';
                case 'operator': return '#EF4444';
                case 'result': return '#10B981';
                case 'variable': return '#8B5CF6';
                default: return '#6B7280';
              }
            }}
            className="!bg-white !border-gray-200"
          />

          {/* Workflow Controls Panel - Made smaller */}
          <Panel position="top-left" className="bg-white rounded-lg shadow-sm border p-3 m-2 w-64">
            <WorkflowControls />
          </Panel>

          {/* Active Workflow Info - Made smaller */}
          {activeWorkflow && (
            <Panel position="top-right" className="bg-white rounded-lg shadow-sm border p-3 m-2 max-w-xs">
              <h4 className="font-semibold text-gray-900 mb-1 text-sm">{activeWorkflow.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{activeWorkflow.description}</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>Pattern: {activeWorkflow.pattern}</div>
                <div>Operations: {activeWorkflow.operations.join(', ')}</div>
                <div>Complexity: {activeWorkflow.complexity}</div>
                <div>Usage: {activeWorkflow.usageCount} times</div>
              </div>
            </Panel>
          )}

          {/* Empty State - Positioned to avoid all panel overlaps */}
          {nodes.length === 0 && (
            <Panel position="top-center" className="text-center" style={{ transform: 'translate(0, 100px)' }}>
              <div className="bg-white rounded-lg shadow-sm border p-6 max-w-sm">
                <div className="text-5xl mb-3">🔧</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Workflow Selected
                </h3>
                <p className="text-gray-600 mb-3 text-sm">
                  Select a workflow template from the left panel or ask the AI assistant to create a custom workflow.
                </p>
                <div className="text-xs text-gray-500">
                  <div className="mb-2"><strong>Try asking:</strong></div>
                  <ul className="text-left space-y-1">
                    <li>• "Create workflow for 3 + 5"</li>
                    <li>• "I need x + y - z / u"</li>
                    <li>• "Build percentage calculator"</li>
                  </ul>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

// Helper functions to convert between store and ReactFlow formats
function convertToReactFlowNode(workflowNode: WorkflowNodeType): Node {
  return {
    id: workflowNode.id,
    type: workflowNode.type,
    position: workflowNode.position,
    draggable: true,
    selectable: true,
    connectable: true,
    data: {
      ...workflowNode.data,
      onChange: (updates: any) => {
        // Handle node data updates
        console.log('Node data updated:', updates);
      },
    },
  };
}

function convertToReactFlowEdge(workflowEdge: any): Edge {
  return {
    id: workflowEdge.id,
    source: workflowEdge.source,
    target: workflowEdge.target,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6B7280', strokeWidth: 2 },
  };
}

// Convert ReactFlow nodes back to workflow nodes
function convertToWorkflowNode(reactFlowNode: Node): WorkflowNodeType {
  return {
    id: reactFlowNode.id,
    type: reactFlowNode.type as any,
    position: reactFlowNode.position,
    data: reactFlowNode.data,
  };
}

// Convert ReactFlow edges back to workflow edges
function convertToWorkflowEdge(reactFlowEdge: Edge): any {
  return {
    id: reactFlowEdge.id,
    source: reactFlowEdge.source,
    target: reactFlowEdge.target,
  };
}