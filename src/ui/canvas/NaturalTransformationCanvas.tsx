/**
 * NaturalTransformationCanvas — Chapter 6. Left column: the objects of C, each annotated with
 * the component it needs (α : F(A) → G(A)). Right column: the candidate component morphisms of D
 * (those typed F(A) → G(A) for some object). The player draws one edge per C-object to choose its
 * component; the edges reduce to `{ components }` for `validateNaturalTransformation`.
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
import type { SmallCategoryData, CategoryWithCompositionData } from '../../schemas';
import { nodeTypes } from './nodeTypes';
import type { FunctorChipData } from './nodes/FunctorChipNode';

const TARGET_X = 560;
const SOURCE_X = 40;

export type NaturalTransformationCanvasProps = {
  sourceCategory: SmallCategoryData;
  targetCategory: CategoryWithCompositionData;
  functorF: FunctorMapping;
  functorG: FunctorMapping;
  theme: ThemeId;
  locked?: boolean;
  onComponentsChange: (components: Record<string, string>) => void;
};

type ChipNode = Node<FunctorChipData>;

const dLabel = (cat: CategoryWithCompositionData, id: string) =>
  cat.objects.find((o) => o.id === id)?.formalLabel ?? id;

export function NaturalTransformationCanvas({
  sourceCategory,
  targetCategory,
  functorF,
  functorG,
  theme,
  locked = false,
  onComponentsChange,
}: NaturalTransformationCanvasProps) {
  const initialNodes = useMemo<ChipNode[]>(() => {
    const nodes: ChipNode[] = [];

    // Left: objects of C, each needing a component α : F(A) → G(A).
    let y = 24;
    for (const o of sourceCategory.objects) {
      const fa = functorF.objectMap[o.id];
      const ga = functorG.objectMap[o.id];
      nodes.push({
        id: `source:object:${o.id}`,
        type: 'functorChip',
        position: { x: SOURCE_X, y },
        draggable: false,
        selectable: false,
        data: {
          side: 'source',
          kind: 'object',
          refId: o.id,
          label: o.labels[theme],
          sub: fa && ga ? `α : ${dLabel(targetCategory, fa)} → ${dLabel(targetCategory, ga)}` : undefined,
          colorToken: o.colorToken,
        },
      });
      y += 88;
    }

    // Right: candidate component morphisms of D — those typed F(A) → G(A) for some object A.
    const validTargets = new Set(
      sourceCategory.objects.map((o) => `${functorF.objectMap[o.id]}>${functorG.objectMap[o.id]}`),
    );
    const candidates = targetCategory.morphisms.filter((m) =>
      validTargets.has(`${m.sourceObjectId}>${m.targetObjectId}`),
    );
    y = 24;
    for (const m of candidates) {
      nodes.push({
        id: `target:morphism:${m.id}`,
        type: 'functorChip',
        position: { x: TARGET_X, y },
        draggable: false,
        selectable: false,
        data: {
          side: 'target',
          kind: 'morphism',
          refId: m.id,
          label: m.labels[theme],
          sub: `${dLabel(targetCategory, m.sourceObjectId)} → ${dLabel(targetCategory, m.targetObjectId)}`,
        },
      });
      y += 80;
    }
    return nodes;
  }, [sourceCategory, targetCategory, functorF, functorG, theme]);

  const nodesById = useMemo(() => new Map(initialNodes.map((n) => [n.id, n])), [initialNodes]);
  const [nodes, , onNodesChange] = useNodesState<FunctorChipData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    const components: Record<string, string> = {};
    for (const e of edges) {
      const s = nodesById.get(e.source)?.data;
      const t = nodesById.get(e.target)?.data;
      if (s?.side === 'source' && t?.side === 'target') components[s.refId] = t.refId;
    }
    onComponentsChange(components);
  }, [edges, nodesById, onComponentsChange]);

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
        ...eds.filter((e) => e.source !== c.source), // one component per object
        {
          id: `comp:${c.source}`,
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
        Objects of C (need a component)
      </div>
      <div className="pointer-events-none absolute right-3 top-2 z-10 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Component candidates in D
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
