import { describe, it, expect } from 'vitest';
import { getPuzzle, toDiagram } from '../../data';
import { isAuthored } from '../../schemas';
import type { PuzzleGraph } from '../../domain';
import { deriveNotation } from './notation';

function fixture(id: string) {
  const p = getPuzzle(id);
  if (!p || !isAuthored(p)) throw new Error(id);
  return { diagram: toDiagram(p), nodes: p.initialGraph.nodes };
}
function graphWith(id: string, edges: [string, string][]): PuzzleGraph {
  const { nodes } = fixture(id);
  return { nodes, edges: edges.map(([s, t], i) => ({ id: `e${i}`, sourceNodeId: s, targetNodeId: t })) };
}

describe('deriveNotation', () => {
  it('shows nothing meaningful for an empty board with no selection', () => {
    const { diagram } = fixture('puzzle-03');
    expect(deriveNotation(diagram, graphWith('puzzle-03', []), [], 'data')).toEqual([]);
  });

  it('populates an object when one is selected', () => {
    const { diagram } = fixture('puzzle-03');
    const lines = deriveNotation(diagram, graphWith('puzzle-03', []), ['n-a'], 'data');
    expect(lines).toHaveLength(1);
    expect(lines[0].caption).toBe('Selected object');
    expect(lines[0].formal).toBe('A');
    expect(lines[0].themed).toBe('Raw CSV');
  });

  it('writes a single wired arrow as f : A → B', () => {
    const { diagram } = fixture('puzzle-03');
    const lines = deriveNotation(diagram, graphWith('puzzle-03', [['n-a', 'n-parser'], ['n-parser', 'n-b']]), [], 'data');
    expect(lines[0].formal).toBe('f : A → B');
    expect(lines[0].themed).toContain('Parser : Raw CSV → Clean Table');
  });

  it('writes a chain as a right-to-left composite g ∘ f : A → C', () => {
    const { diagram } = fixture('puzzle-03');
    const lines = deriveNotation(
      diagram,
      graphWith('puzzle-03', [['n-a', 'n-parser'], ['n-parser', 'n-b'], ['n-b', 'n-charter'], ['n-charter', 'n-c']]),
      [],
      'data',
    );
    expect(lines[0].formal).toMatch(/^h ∘ f : A → C/);
    expect(lines[0].formal).toContain('composite');
  });

  it('uses theme language in the themed form (spellcraft)', () => {
    const { diagram } = fixture('puzzle-03');
    const lines = deriveNotation(diagram, graphWith('puzzle-03', [['n-a', 'n-parser'], ['n-parser', 'n-b']]), [], 'spellcraft');
    expect(lines[0].themed).toContain('Ignition : Spark → Flame');
  });
});
