import { describe, it, expect } from 'vitest';
import type { Diagram, ThemeText } from './types';
import type { PuzzleGraph } from './graph';
import { tracePath, morphismIdsUsed } from './graph';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });

const diagram: Diagram = {
  objects: [
    { id: 'A', labels: t('A') },
    { id: 'B', labels: t('B') },
    { id: 'C', labels: t('C') },
  ],
  morphisms: [
    { id: 'f', sourceObjectId: 'A', targetObjectId: 'B', labels: t('f') },
    { id: 'g', sourceObjectId: 'B', targetObjectId: 'C', labels: t('g') },
  ],
};

describe('tracePath', () => {
  it('traces a linear A -> f -> B -> g -> C construction', () => {
    const graph: PuzzleGraph = {
      nodes: [
        { kind: 'object', nodeId: 'na', objectId: 'A', role: 'start' },
        { kind: 'morphism', nodeId: 'nf', morphismId: 'f' },
        { kind: 'object', nodeId: 'nb', objectId: 'B' },
        { kind: 'morphism', nodeId: 'ng', morphismId: 'g' },
        { kind: 'object', nodeId: 'nc', objectId: 'C', role: 'goal' },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'na', targetNodeId: 'nf' },
        { id: 'e2', sourceNodeId: 'nf', targetNodeId: 'nb' },
        { id: 'e3', sourceNodeId: 'nb', targetNodeId: 'ng' },
        { id: 'e4', sourceNodeId: 'ng', targetNodeId: 'nc' },
      ],
    };
    const r = tracePath(diagram, graph);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.startObjectId).toBe('A');
      expect(r.value.finalObjectId).toBe('C');
      expect(r.value.morphismIds).toEqual(['f', 'g']);
    }
    expect(morphismIdsUsed(graph)).toEqual(['f', 'g']);
  });

  it('detects a cycle', () => {
    const graph: PuzzleGraph = {
      nodes: [
        { kind: 'object', nodeId: 'na', objectId: 'A', role: 'start' },
        { kind: 'morphism', nodeId: 'nf', morphismId: 'f' },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'na', targetNodeId: 'nf' },
        { id: 'e2', sourceNodeId: 'nf', targetNodeId: 'na' },
      ],
    };
    const r = tracePath(diagram, graph);
    expect(r.ok).toBe(false);
  });
});
