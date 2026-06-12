import { describe, it, expect } from 'vitest';
import type { PuzzleGraph } from '../domain';
import { getPuzzle, toValidationInput } from '../data';
import { isAuthored } from '../schemas';
import { validatePuzzle } from './validatePuzzle';

const puzzle = getPuzzle('puzzle-01');

describe('validatePuzzle — puzzle-01', () => {
  it('puzzle-01 is authored and has a reference solution', () => {
    expect(puzzle).toBeDefined();
    expect(puzzle && isAuthored(puzzle)).toBe(true);
  });

  if (!puzzle || !isAuthored(puzzle) || !puzzle.referenceSolution) {
    it.skip('reference solution missing — skipping', () => {});
    return;
  }

  const input = toValidationInput(puzzle);

  it('accepts the reference solution', () => {
    const result = validatePuzzle(input, puzzle.referenceSolution!);
    expect(result.ok).toBe(true);
  });

  it('fails required-output when nothing is wired (input never reaches the goal value)', () => {
    const graph: PuzzleGraph = {
      nodes: [{ kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' }],
      edges: [],
    };
    const result = validatePuzzle(input, graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.firstFailure.rule.type).toBe('required-output');
  });

  it('fails required-output when the wrong-behaved machine (Shredder) is wired', () => {
    // mor-shred is the same type (A→B) but turns the input into the wrong value.
    const graph: PuzzleGraph = {
      nodes: [
        { kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' },
        { kind: 'morphism', nodeId: 'n-shred', morphismId: 'mor-shred' },
        { kind: 'object', nodeId: 'n-b', objectId: 'obj-b', role: 'goal' },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n-a', targetNodeId: 'n-shred' },
        { id: 'e2', sourceNodeId: 'n-shred', targetNodeId: 'n-b' },
      ],
    };
    const result = validatePuzzle(input, graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.firstFailure.rule.type).toBe('required-output');
  });
});
