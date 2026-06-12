/**
 * FunctorCanvas — the Chapter-4 interaction. Renders two categories as columns of chips (objects
 * and morphisms): the source category on the left, the target on the right. The player draws
 * mapping edges from each source chip to a target chip (object→object, morphism→morphism). The
 * drawn edges are reduced to a `FunctorMapping` and handed up for validation.
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
import type { ThemeId, FunctorMapping } from '../../domain';
import type { SmallCategoryData } from '../../schemas';
import { nodeTypes, FUNCTOR_CHIP_TYPE } from './nodeTypes';
import type { FunctorChipData } from './nodes/FunctorChipNode';

const TARGET_X = 560;
const SOURCE_X = 40;

export type FunctorCanvasProps = {
  source: SmallCategoryData;
  target: SmallCategoryData;
  theme: ThemeId;
  locked?: boolean;
  onMappingChange: (mapping: FunctorMapping) => void;
};

type ChipNode = Node<FunctorChipData>;

function flabel(cat: SmallCategoryData, objectId: string): string {
  const o = cat.objects.find((x) => x.id === objectId);
  return o?.formalLabel ?? objectId;
}

function buildChips(cat: SmallCategoryData, side: 'source' | 'target', theme: ThemeId): ChipNode[] {
  const x = side === 'source' ? SOURCE_X : TARGET_X;
  const out: ChipNode[] = [];
  let y = 24;
  for (const o of cat.objects) {
    out.push({
      id: `${side}:object:${o.id}`,
      type: FUNCTOR_CHIP_TYPE,
      position: { x, y },
      draggable: false,
      selectable: false,
      data: { side, kind: 'object', refId: o.id, label: o.labels[theme], colorToken: o.colorToken },
    });
    y += 72;
  }
  y += 28;
  for (const m of cat.morphisms) {
    out.push({
      id: `${side}:morphism:${m.id}`,
      type: FUNCTOR_CHIP_TYPE,
      position: { x, y },
      draggable: false,
      selectable: false,
      data: {
        side,
        kind: 'morphism',
        refId: m.id,
        label: m.labels[theme],
        sub: `${flabel(cat, m.sourceObjectId)} → ${flabel(cat, m.targetObjectId)}`,
      },
    });
    y += 80;
  }
  return out;
}

export function FunctorCanvas({ source, target, theme, locked = false, onMappingChange }: FunctorCanvasProps) {
  const initialNodes = useMemo(
    () => [...buildChips(source, 'source', theme), ...buildChips(target, 'target', theme)],
    [source, target, theme],
  );
  const nodesById = useMemo(() => new Map(initialNodes.map((n) => [n.id, n])), [initialNodes]);

  const [nodes, , onNodesChange] = useNodesState<FunctorChipData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Emit the mapping derived from the drawn edges.
  useEffect(() => {
    const objectMap: Record<string, string> = {};
    const morphismMap: Record<string, string> = {};
    for (const e of edges) {
      const s = nodesById.get(e.source)?.data;
      const t = nodesById.get(e.target)?.data;
      if (!s || !t) continue;
      if (s.kind === 'object' && t.kind === 'object') objectMap[s.refId] = t.refId;
      else if (s.kind === 'morphism' && t.kind === 'morphism') morphismMap[s.refId] = t.refId;
    }
    onMappingChange({ objectMap, morphismMap });
  }, [edges, nodesById, onMappingChange]);

  const isValidConnection = useCallback(
    (c: Connection) => {
      const s = c.source ? nodesById.get(c.source)?.data : undefined;
      const t = c.target ? nodesById.get(c.target)?.data : undefined;
      return Boolean(s && t && s.side === 'source' && t.side === 'target' && s.kind === t.kind);
    },
    [nodesById],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || !isValidConnection(c)) return;
      setEdges((eds) => [
        // one image per source chip — a functor is a function
        ...eds.filter((e) => e.source !== c.source),
        {
          id: `map:${c.source}`,
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
        Source category
      </div>
      <div className="pointer-events-none absolute right-3 top-2 z-10 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Target category
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
