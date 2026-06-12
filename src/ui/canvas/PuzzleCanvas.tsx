/**
 * PuzzleCanvas — the React Flow graph editor for a puzzle. Owns React Flow state and emits the
 * equivalent domain `PuzzleGraph` on every change via `onGraphChange`, so the parent can save
 * progress and run validation. It never imports domain logic beyond the adapter + diagram.
 *
 * Theme switching / reset is handled by the parent remounting this component (via `key`); on
 * mount it renders whatever `initialGraph` it is given, which preserves the constructed graph
 * across theme changes because the parent feeds back the saved graph.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Diagram, PuzzleGraph, ThemeId } from '../../domain';
import {
  fromReactFlow,
  toReactFlow,
  type MachineNodeData,
  type ObjectNodeData,
  type RFNode,
} from '../../flow/adapter';
import { nodeTypes } from './nodeTypes';

type RFNodeData = ObjectNodeData | MachineNodeData;

export type PuzzleCanvasProps = {
  diagram: Diagram;
  initialGraph: PuzzleGraph;
  theme: ThemeId;
  showFormalLabels: boolean;
  animated: boolean;
  /** Lock editing (e.g. after a successful solution). */
  locked?: boolean;
  onGraphChange: (graph: PuzzleGraph) => void;
};

export function PuzzleCanvas({
  diagram,
  initialGraph,
  theme,
  showFormalLabels,
  animated,
  locked = false,
  onGraphChange,
}: PuzzleCanvasProps) {
  const initial = useMemo(
    () => toReactFlow(initialGraph, diagram, { theme, showFormalLabels, animated }),
    // Computed once per mount; theme/reset changes remount via the parent's `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [nodes, , onNodesChange] = useNodesState<RFNodeData>(initial.nodes as Node<RFNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const edgeCounter = useRef(initial.edges.length);

  // Keep wire animation in sync without losing the graph.
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, animated })));
  }, [animated, setEdges]);

  // Emit the domain graph whenever nodes/edges change so the parent can save + validate.
  useEffect(() => {
    onGraphChange(fromReactFlow(nodes as RFNode[], edges));
  }, [nodes, edges, onGraphChange]);

  const isValidConnection = useCallback(
    (c: Connection) => c.source !== null && c.target !== null && c.source !== c.target,
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      edgeCounter.current += 1;
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${edgeCounter.current}`,
        source: connection.source!,
        target: connection.target!,
        animated,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [animated, setEdges],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        nodesDraggable={!locked}
        edgesUpdatable={!locked}
        elementsSelectable={!locked}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
