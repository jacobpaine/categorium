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

  it('fails required-final-object when the path does not reach the goal', () => {
    // Start present, nothing wired: path ends at the start object, not obj-b.
    const graph: PuzzleGraph = {
      nodes: [{ kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' }],
      edges: [],
    };
    const result = validatePuzzle(input, graph);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.firstFailure.rule.type).toBe('required-final-object');
    }
  });

  it('fails allowed-morphisms-only when a disallowed machine is used', () => {
    const graph: PuzzleGraph = {
      nodes: [
        { kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' },
        { kind: 'morphism', nodeId: 'n-x', morphismId: 'mor-x' },
        { kind: 'object', nodeId: 'n-b', objectId: 'obj-b', role: 'goal' },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n-a', targetNodeId: 'n-x' },
        { id: 'e2', sourceNodeId: 'n-x', targetNodeId: 'n-b' },
      ],
    };
    const result = validatePuzzle(input, graph);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.firstFailure.rule.type).toBe('allowed-morphisms-only');
    }
  });
});
