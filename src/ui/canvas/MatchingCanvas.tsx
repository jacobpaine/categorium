/**
 * MatchingCanvas — a "bijection-matching" board. Left column: items to match. Right column:
 * candidates (may include distractors). The player draws one edge per left item to its match;
 * the edges reduce to a `{ leftId: rightId }` pairing for validation. Mirrors the natural-
 * transformation board's two-column draw, but with content-agnostic cards.
 */
import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { ThemeId } from '../../domain';
import type { MatchItem } from '../../schemas';
import { nodeTypes } from './nodeTypes';
import type { FunctorChipData } from './nodes/FunctorChipNode';

const LEFT_X = 40;
const RIGHT_X = 520;

export type MatchingCanvasProps = {
  left: MatchItem[];
  right: MatchItem[];
  theme: ThemeId;
  locked?: boolean;
  onPairingChange: (pairing: Record<string, string>) => void;
};

type ChipNode = Node<FunctorChipData>;

export function MatchingCanvas({ left, right, theme, locked = false, onPairingChange }: MatchingCanvasProps) {
  const initialNodes = useMemo<ChipNode[]>(() => {
    const nodes: ChipNode[] = [];
    let y = 24;
    for (const item of left) {
      nodes.push({
        id: `source:item:${item.id}`,
        type: 'functorChip',
        position: { x: LEFT_X, y },
        draggable: false,
        selectable: false,
        data: {
          side: 'source',
          kind: 'object',
          refId: item.id,
          label: item.label[theme],
          sub: item.sub?.[theme],
          colorToken: 'sky',
        },
      });
      y += 96;
    }
    y = 24;
    for (const item of right) {
      nodes.push({
        id: `target:item:${item.id}`,
        type: 'functorChip',
        position: { x: RIGHT_X, y },
        draggable: false,
        selectable: false,
        data: {
          side: 'target',
          kind: 'morphism',
          refId: item.id,
          label: item.label[theme],
          sub: item.sub?.[theme],
        },
      });
      y += 88;
    }
    return nodes;
  }, [left, right, theme]);

  const nodesById = useMemo(() => new Map(initialNodes.map((n) => [n.id, n])), [initialNodes]);
  const [nodes, , onNodesChange] = useNodesState<FunctorChipData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    const pairing: Record<string, string> = {};
    for (const e of edges) {
      const s = nodesById.get(e.source)?.data;
      const t = nodesById.get(e.target)?.data;
      if (s?.side === 'source' && t?.side === 'target') pairing[s.refId] = t.refId;
    }
    onPairingChange(pairing);
  }, [edges, nodesById, onPairingChange]);

  const isValidConnection = useCallback(
    (c: Connection) => {
      const s = c.source ? nodesById.get(c.source)?.data : undefined;
      const t = c.target ? nodesById.get(c.target)?.data : undefined;
      return Boolean(s && t && s.side === 'source' && t.side === 'target');
    },
    [nodesById],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !isValidConnection(c)) return;
      setEdges((eds) => [
        ...eds.filter((e) => e.source !== c.source), // one match per left item
        {
          id: `match:${c.source}`,
          source: c.source!,
          target: c.target!,
          animated: true,
          style: { stroke: '#6366f1', strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        },
      ]);
    },
    [isValidConnection, setEdges],
  );

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-3 top-2 z-10 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Match each…
      </div>
      <div className="pointer-events-none absolute right-3 top-2 z-10 text-xs font-semibold uppercase tracking-wide text-slate-400">
        …to its partner
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        nodesDraggable={false}
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
