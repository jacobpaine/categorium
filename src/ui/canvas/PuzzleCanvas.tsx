/**
 * PuzzleCanvas — the React Flow graph editor for a puzzle. Owns React Flow state and emits the
 * equivalent domain `PuzzleGraph` on every change via `onGraphChange`, so the parent can save
 * progress and run validation. It never imports domain logic beyond the adapter + diagram.
 *
 * Theme switching / reset is handled by the parent remounting this component (via `key`); on
 * mount it renders whatever `initialGraph` it is given, which preserves the constructed graph
 * across theme changes because the parent feeds back the saved graph.
 *
 * After a successful Run (`animated` flips true), a sample token animates along the solved path
 * (see sampleAnimation.ts). The token lives in its OWN state, never in the validated `nodes`,
 * so it can't leak into `onGraphChange`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  SAMPLE_TOKEN_ID,
  SAMPLE_TOKEN_TYPE,
  type SampleTokenData,
} from './nodes/SampleTokenNode';
import { computeSampleFrames } from './sampleAnimation';

type RFNodeData = ObjectNodeData | MachineNodeData;

/** Milliseconds per hop — matches the CSS transition on `.react-flow__node-sampleToken`. */
const STEP_MS = 700;

export type PuzzleCanvasProps = {
  diagram: Diagram;
  initialGraph: PuzzleGraph;
  theme: ThemeId;
  showFormalLabels: boolean;
  animated: boolean;
  /** Lock editing (e.g. after a successful solution). */
  locked?: boolean;
  /** Resolved (theme-specific) value to show for each object id while the sample flows. */
  tokenValueByObjectId?: Record<string, string>;
  /** Play the sample-flow token on success. Off for static previews (e.g. reference solution). */
  animateSampleFlow?: boolean;
  onGraphChange: (graph: PuzzleGraph) => void;
};

export function PuzzleCanvas({
  diagram,
  initialGraph,
  theme,
  showFormalLabels,
  animated,
  locked = false,
  tokenValueByObjectId = {},
  animateSampleFlow = true,
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

  // The sample token lives outside `nodes` so it never reaches onGraphChange / validation.
  const [token, setToken] = useState<Node<SampleTokenData> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sampleRan = useRef(false);

  // Keep wire animation in sync without losing the graph.
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, animated })));
  }, [animated, setEdges]);

  // Emit the domain graph whenever nodes/edges change so the parent can save + validate.
  useEffect(() => {
    onGraphChange(fromReactFlow(nodes as RFNode[], edges));
  }, [nodes, edges, onGraphChange]);

  // Drive the sample-flow animation once when the puzzle is solved.
  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    if (!animated || !animateSampleFlow) {
      sampleRan.current = false;
      clear();
      setToken(null);
      return;
    }
    if (sampleRan.current) return;
    sampleRan.current = true;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) return;

    const frames = computeSampleFrames(nodes as Node[], edges, tokenValueByObjectId);
    if (frames.length < 2) return;

    setToken({
      id: SAMPLE_TOKEN_ID,
      type: SAMPLE_TOKEN_TYPE,
      position: frames[0].position,
      data: { label: frames[0].label },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: 1000,
    });

    frames.slice(1).forEach((f, i) => {
      timers.current.push(
        setTimeout(() => {
          setToken((t) => (t ? { ...t, position: f.position, data: { label: f.label } } : t));
        }, (i + 1) * STEP_MS),
      );
    });

    const doneAt = frames.length * STEP_MS;
    timers.current.push(
      setTimeout(() => {
        setToken((t) => (t ? { ...t, data: { ...t.data, done: true } } : t));
      }, doneAt),
    );
    timers.current.push(setTimeout(() => setToken(null), doneAt + 1000));

    return clear;
    // Intentionally only re-run when `animated` flips; nodes/edges are read at trigger time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

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

  const renderedNodes = useMemo(
    () => (token ? ([...nodes, token] as Node[]) : (nodes as Node[])),
    [nodes, token],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={renderedNodes}
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
