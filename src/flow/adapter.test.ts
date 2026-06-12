import { describe, it, expect } from 'vitest';
import { getPuzzle, toDiagram } from '../data';
import { isAuthored } from '../schemas';
import { OBJECT_NODE_TYPE, MACHINE_NODE_TYPE, toReactFlow, fromReactFlow, type RFNode } from './adapter';

const puzzle = getPuzzle('puzzle-01');

describe('react flow adapter', () => {
  it('maps the puzzle-1 reference solution to RF nodes/edges with theme labels', () => {
    if (!puzzle || !isAuthored(puzzle) || !puzzle.referenceSolution) throw new Error('fixture');
    const diagram = toDiagram(puzzle);
    const { nodes, edges } = toReactFlow(puzzle.referenceSolution, diagram, { theme: 'data' });

    const machine = nodes.find((n) => n.type === MACHINE_NODE_TYPE);
    const start = nodes.find((n) => n.type === OBJECT_NODE_TYPE && n.id === 'n-a');
    expect(machine?.data.label).toBe('Parser'); // data theme label for mor-f
    expect((start?.data as { label: string }).label).toBe('Raw CSV');
    expect((start?.data as { role?: string }).role).toBe('start');
    expect(edges).toHaveLength(2);
    // Positions from the authored layout are carried through.
    expect(machine?.position).toEqual({ x: 340, y: 140 });
  });

  it('round-trips RF -> domain graph preserving structure', () => {
    if (!puzzle || !isAuthored(puzzle) || !puzzle.referenceSolution) throw new Error('fixture');
    const diagram = toDiagram(puzzle);
    const { nodes, edges } = toReactFlow(puzzle.referenceSolution, diagram, { theme: 'abstract' });
    const back = fromReactFlow(nodes as RFNode[], edges);

    expect(back.nodes.map((n) => n.nodeId).sort()).toEqual(['n-a', 'n-b', 'n-f']);
    const machine = back.nodes.find((n) => n.kind === 'morphism');
    expect(machine && machine.kind === 'morphism' && machine.morphismId).toBe('mor-f');
    expect(back.edges.map((e) => [e.sourceNodeId, e.targetNodeId])).toEqual([
      ['n-a', 'n-f'],
      ['n-f', 'n-b'],
    ]);
  });
});
