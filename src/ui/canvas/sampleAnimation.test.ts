import { describe, it, expect } from 'vitest';
import type { Edge, Node } from 'reactflow';
import { OBJECT_NODE_TYPE, MACHINE_NODE_TYPE } from '../../flow/adapter';
import { computeSampleFrames } from './sampleAnimation';

function obj(id: string, objectId: string, label: string, role?: 'start' | 'goal'): Node {
  return { id, type: OBJECT_NODE_TYPE, position: { x: 0, y: 100 }, data: { objectId, label, role, showFormal: false } };
}
function mach(id: string, label: string): Node {
  return { id, type: MACHINE_NODE_TYPE, position: { x: 0, y: 100 }, data: { morphismId: id, label, showFormal: false } };
}

const nodes: Node[] = [obj('n-a', 'obj-a', 'A', 'start'), mach('n-f', 'f'), obj('n-b', 'obj-b', 'B', 'goal')];
const edges: Edge[] = [
  { id: 'e1', source: 'n-a', target: 'n-f' },
  { id: 'e2', source: 'n-f', target: 'n-b' },
];

describe('computeSampleFrames', () => {
  it('carries the input value through the machine, then shows the output', () => {
    const frames = computeSampleFrames(nodes, edges, { 'obj-a': 'Raw CSV', 'obj-b': 'Clean Table' });
    expect(frames.map((f) => f.label)).toEqual(['Raw CSV', 'Raw CSV', 'Clean Table']);
  });

  it('falls back to the node label when no sample value is provided', () => {
    const frames = computeSampleFrames(nodes, edges, {});
    expect(frames.map((f) => f.label)).toEqual(['A', 'A', 'B']);
  });

  it('returns nothing to animate when no path is wired', () => {
    expect(computeSampleFrames(nodes, [], {})).toHaveLength(1); // just the start, no hops
  });
});
