/**
 * Computes the waypoints a sample token follows along the solved path, and the value it carries
 * at each step. Two modes:
 *  - structural (default): the carried label is the object's theme label (used when a puzzle has
 *    no behavior — Ch2–6);
 *  - behavior: the token carries a real sample VALUE that is transformed by each machine via the
 *    value runtime (`runMorphism`), so the animation shows the genuine input → output (and jams if
 *    a machine can't process what reaches it).
 */
import type { Edge, Node } from 'reactflow';
import type { Diagram } from '../../domain';
import { runMorphism } from '../../domain';
import { OBJECT_NODE_TYPE, MACHINE_NODE_TYPE, type MachineNodeData, type ObjectNodeData } from '../../flow/adapter';

export type SampleFrame = { position: { x: number; y: number }; label: string; jam?: boolean };

/** Behavior context: run a real value through the machines, labelling each value. */
export type BehaviorContext = {
  diagram: Diagram;
  inputValueId: string;
  labelOf: (valueId: string) => string;
};

const TOKEN_Y_OFFSET = -44;
const pos = (n: Node) => ({ x: n.position.x, y: n.position.y + TOKEN_Y_OFFSET });

function findStart(nodes: Node[], edges: Edge[]): Node | undefined {
  const objectNodes = nodes.filter((n) => n.type === OBJECT_NODE_TYPE);
  const hasIncoming = (id: string) => edges.some((e) => e.target === id);
  return (
    objectNodes.find((n) => (n.data as ObjectNodeData).role === 'start') ??
    objectNodes.find((n) => !hasIncoming(n.id))
  );
}

export function computeSampleFrames(
  nodes: Node[],
  edges: Edge[],
  valueByObjectId: Record<string, string>,
  behavior?: BehaviorContext,
): SampleFrame[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const start = findStart(nodes, edges);
  if (!start) return [];

  const frames: SampleFrame[] = [];
  const visited = new Set<string>();
  let current: Node | undefined = start;

  if (behavior) {
    // Carry a real value, transforming it at each machine.
    let valueId = behavior.inputValueId;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.type === MACHINE_NODE_TYPE) {
        const step = runMorphism(behavior.diagram, (current.data as MachineNodeData).morphismId, valueId);
        if (!step.ok) {
          frames.push({ position: pos(current), label: behavior.labelOf(valueId), jam: true });
          break;
        }
        frames.push({ position: pos(current), label: behavior.labelOf(valueId) });
        valueId = step.value;
      } else {
        frames.push({ position: pos(current), label: behavior.labelOf(valueId) });
      }
      const out = edges.find((e) => e.source === current!.id);
      if (!out) break;
      current = byId.get(out.target);
    }
    return frames;
  }

  // Structural mode: the carried label is the most recent object's label.
  const valueOf = (n: Node): string => {
    const data = n.data as ObjectNodeData;
    return valueByObjectId[data.objectId] ?? data.label ?? '';
  };
  let carried = '';
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.type === OBJECT_NODE_TYPE) carried = valueOf(current);
    frames.push({ position: pos(current), label: carried });
    const out = edges.find((e) => e.source === current!.id);
    if (!out) break;
    current = byId.get(out.target);
  }
  return frames;
}
