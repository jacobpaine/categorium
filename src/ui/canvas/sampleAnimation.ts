/**
 * Computes the waypoints a sample token follows along the solved path, and the value it carries
 * at each step. Walks the React Flow nodes/edges (the player's construction) from the start
 * terminal; the carried value updates each time the token reaches an object terminal, so the
 * sequence reads as "input → (machine) → output".
 */
import type { Edge, Node } from 'reactflow';
import { OBJECT_NODE_TYPE, type ObjectNodeData } from '../../flow/adapter';

export type SampleFrame = { position: { x: number; y: number }; label: string };

/** Vertical offset so the token floats above the nodes rather than covering them. */
const TOKEN_Y_OFFSET = -44;

export function computeSampleFrames(
  nodes: Node[],
  edges: Edge[],
  valueByObjectId: Record<string, string>,
): SampleFrame[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const objectNodes = nodes.filter((n) => n.type === OBJECT_NODE_TYPE);
  if (objectNodes.length === 0) return [];

  const hasIncoming = (id: string) => edges.some((e) => e.target === id);
  const start =
    objectNodes.find((n) => (n.data as ObjectNodeData).role === 'start') ??
    objectNodes.find((n) => !hasIncoming(n.id));
  if (!start) return [];

  const valueOf = (n: Node): string => {
    const data = n.data as ObjectNodeData;
    return valueByObjectId[data.objectId] ?? data.label ?? '';
  };

  const frames: SampleFrame[] = [];
  const visited = new Set<string>();
  let current: Node | undefined = start;
  let carried = '';

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.type === OBJECT_NODE_TYPE) carried = valueOf(current);
    frames.push({
      position: { x: current.position.x, y: current.position.y + TOKEN_Y_OFFSET },
      label: carried,
    });
    const out = edges.find((e) => e.source === current!.id);
    if (!out) break;
    current = byId.get(out.target);
  }

  return frames;
}
