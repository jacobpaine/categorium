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
import type { Toolkit } from '../../schemas';
import {
  buildMorphismNode,
  buildObjectNode,
  fromReactFlow,
  toReactFlow,
  OBJECT_NODE_TYPE,
  type MachineNodeData,
  type ObjectNodeData,
  type RFNode,
} from '../../flow/adapter';
import { nodeTypes } from './nodeTypes';
import { ToolkitPalette } from './ToolkitPalette';
import {
  SAMPLE_TOKEN_ID,
  SAMPLE_TOKEN_TYPE,
  type SampleTokenData,
} from './nodes/SampleTokenNode';
import { computeSampleFrames, type BehaviorContext, type SampleFrame } from './sampleAnimation';
import { deriveNotation } from './notation';
import { NotationBox } from './NotationBox';

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
  /** When set, the token carries a real value transformed by the machines (behavior puzzles). */
  behaviorFlow?: BehaviorContext;
  /** Increment to replay the behavior value-flow on each Run (right or wrong). */
  runSignal?: number;
  /** Show the live category-theory notation box at the bottom of the board. */
  showNotation?: boolean;
  /**
   * Toolkit mode: candidate objects/morphisms start in a side tray; the player clicks them onto
   * the board. Absent => every node is pre-placed (classic mode), rendered exactly as before.
   */
  toolkit?: Toolkit;
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
  behaviorFlow,
  runSignal = 0,
  showNotation = true,
  toolkit,
  onGraphChange,
}: PuzzleCanvasProps) {
  const initial = useMemo(
    () => toReactFlow(initialGraph, diagram, { theme, showFormalLabels, animated }),
    // Computed once per mount; theme/reset changes remount via the parent's `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNodeData>(initial.nodes as Node<RFNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const edgeCounter = useRef(initial.edges.length);

  // Toolkit tray: candidates not already on the board (subtracting placed ids handles restore of a
  // saved in-progress graph). Pinned start/goal objects are never in the tray.
  const [trayObjectIds, setTrayObjectIds] = useState<string[]>(() => {
    if (!toolkit) return [];
    const placed = new Set(
      initialGraph.nodes.flatMap((n) => (n.kind === 'object' ? [n.objectId] : [])),
    );
    return toolkit.paletteObjectIds.filter((id) => !placed.has(id));
  });
  const [trayMorphismIds, setTrayMorphismIds] = useState<string[]>(() => {
    if (!toolkit) return [];
    const placed = new Set(
      initialGraph.nodes.flatMap((n) => (n.kind === 'morphism' ? [n.morphismId] : [])),
    );
    return toolkit.paletteMorphismIds.filter((id) => !placed.has(id));
  });
  const placeCounter = useRef(0);

  // The sample token lives outside `nodes` so it never reaches onGraphChange / validation.
  const [token, setToken] = useState<Node<SampleTokenData> | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const playFrames = useCallback(
    (frames: SampleFrame[]) => {
      clearTimers();
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (reduce || frames.length === 0) {
        setToken(null);
        return;
      }
      setToken({
        id: SAMPLE_TOKEN_ID,
        type: SAMPLE_TOKEN_TYPE,
        position: frames[0].position,
        data: { label: frames[0].label, jam: frames[0].jam },
        draggable: false,
        selectable: false,
        connectable: false,
        zIndex: 1000,
      });
      frames.slice(1).forEach((f, i) => {
        timers.current.push(
          setTimeout(() => {
            setToken((t) => (t ? { ...t, position: f.position, data: { label: f.label, jam: f.jam } } : t));
          }, (i + 1) * STEP_MS),
        );
      });
      const doneAt = frames.length * STEP_MS;
      if (!frames[frames.length - 1].jam) {
        timers.current.push(
          setTimeout(() => setToken((t) => (t ? { ...t, data: { ...t.data, done: true } } : t)), doneAt),
        );
      }
      timers.current.push(setTimeout(() => setToken(null), doneAt + 1200));
    },
    [clearTimers],
  );

  // Keep wire animation in sync without losing the graph.
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, animated })));
  }, [animated, setEdges]);

  // Toggle formal labels live: the nodes are built once at mount, so reflect prop changes
  // onto existing node data instead of waiting for a remount (theme switch / reset).
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => (n.data.showFormal === showFormalLabels ? n : { ...n, data: { ...n.data, showFormal: showFormalLabels } })),
    );
  }, [showFormalLabels, setNodes]);

  // Emit the domain graph whenever nodes/edges change so the parent can save + validate.
  useEffect(() => {
    onGraphChange(fromReactFlow(nodes as RFNode[], edges));
  }, [nodes, edges, onGraphChange]);

  // Structural puzzles: animate the labelled token once on success.
  useEffect(() => {
    if (behaviorFlow) return;
    if (!animated || !animateSampleFlow) {
      clearTimers();
      setToken(null);
      return;
    }
    playFrames(computeSampleFrames(nodes as Node[], edges, tokenValueByObjectId));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  // Behavior puzzles: run the real value through the machines on every Run (right or wrong).
  useEffect(() => {
    if (!behaviorFlow || !animateSampleFlow || !runSignal) return;
    playFrames(computeSampleFrames(nodes as Node[], edges, tokenValueByObjectId, behaviorFlow));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSignal]);

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

  // Toolkit click-to-place: materialize a tray item as a real node (same builders as a pre-placed
  // node, so it round-trips through fromReactFlow identically) and remove it from the tray.
  const placeFromTray = useCallback(
    (kind: 'object' | 'morphism', refId: string) => {
      const n = placeCounter.current++;
      // Spawn in a staging area below the pinned start/goal row (which sits at y~180): clear of the
      // pinned nodes so a fresh piece never lands on the start node's handle, yet inside the
      // mount-time fitView band so it's visible. The player drags it where they like.
      const position = { x: 220 + (n % 3) * 170, y: 300 + Math.floor(n / 3) * 90 };
      const nodeId = `tk-${kind}-${refId}-${n}`;
      const opts = { theme, showFormalLabels, animated };
      const built =
        kind === 'object'
          ? buildObjectNode({ kind: 'object', nodeId, objectId: refId, position }, diagram, opts, position)
          : buildMorphismNode(
              { kind: 'morphism', nodeId, morphismId: refId, position },
              diagram,
              opts,
              position,
            );
      setNodes((nds) => [...nds, built as Node<RFNodeData>]);
      if (kind === 'object') setTrayObjectIds((ids) => ids.filter((i) => i !== refId));
      else setTrayMorphismIds((ids) => ids.filter((i) => i !== refId));
    },
    [diagram, theme, showFormalLabels, animated, setNodes],
  );

  // Toolkit return-to-tray: drop a placed (non-pinned) node and its edges, returning it to the tray.
  // Pinned start/goal objects are refused.
  const removeNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === nodeId);
        if (!node) return nds;
        if (node.type === OBJECT_NODE_TYPE) {
          const d = node.data as ObjectNodeData;
          if (d.role === 'start' || d.role === 'goal') return nds; // pinned: never removable
          setTrayObjectIds((ids) => (ids.includes(d.objectId) ? ids : [...ids, d.objectId]));
        } else {
          const refId = (node.data as MachineNodeData).morphismId;
          setTrayMorphismIds((ids) => (ids.includes(refId) ? ids : [...ids, refId]));
        }
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        return nds.filter((n) => n.id !== nodeId);
      });
    },
    [setNodes, setEdges],
  );

  // Delete/Backspace returns the selected placed node(s) to the tray (toolkit only). RF's own
  // delete is disabled in toolkit mode (deleteKeyCode={null}) so pinned nodes can't be dropped.
  useEffect(() => {
    if (!toolkit || locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (selectedNodeIds.length === 0) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      selectedNodeIds.forEach(removeNode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toolkit, locked, selectedNodeIds, removeNode]);

  // Decorate placed (non-pinned) nodes with the ✕ return-to-tray affordance in toolkit mode.
  const decoratedNodes = useMemo(() => {
    if (!toolkit || locked) return nodes;
    return nodes.map((n) => {
      const isPinned =
        n.type === OBJECT_NODE_TYPE &&
        ((n.data as ObjectNodeData).role === 'start' || (n.data as ObjectNodeData).role === 'goal');
      if (isPinned) return n;
      return { ...n, data: { ...n.data, removable: true, onRemove: () => removeNode(n.id) } };
    });
  }, [nodes, toolkit, locked, removeNode]);

  const renderedNodes = useMemo(
    () => (token ? ([...decoratedNodes, token] as Node[]) : (decoratedNodes as Node[])),
    [decoratedNodes, token],
  );

  const onSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: Node[] }) => setSelectedNodeIds(sel.map((n) => n.id)),
    [],
  );

  // Live CT notation for the current selection + wired path (the teaching box at the bottom).
  const notationLines = useMemo(() => {
    if (!showNotation) return [];
    const graph = fromReactFlow(nodes as RFNode[], edges);
    return deriveNotation(diagram, graph, selectedNodeIds, theme);
  }, [showNotation, nodes, edges, diagram, selectedNodeIds, theme]);

  return (
    <div className="relative flex h-full w-full">
      {toolkit && (
        <ToolkitPalette
          diagram={diagram}
          theme={theme}
          showFormalLabels={showFormalLabels}
          objectIds={trayObjectIds}
          morphismIds={trayMorphismIds}
          locked={locked}
          onPlace={placeFromTray}
        />
      )}
      <div className="relative h-full flex-1">
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        nodesDraggable={!locked}
        edgesUpdatable={!locked}
        elementsSelectable
        deleteKeyCode={toolkit ? null : undefined}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      {showNotation && <NotationBox lines={notationLines} />}
      </div>
    </div>
  );
}
