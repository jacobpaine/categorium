import { describe, it, expect } from 'vitest';
import type { PuzzleGraph } from '../domain';
import { getPuzzle, toValidationInput } from '../data';
import { isAuthored } from '../schemas';
import { validatePuzzle } from './validatePuzzle';

const puzzle = getPuzzle('puzzle-d3');

describe('validatePuzzle — puzzle-d3 (invert a composite, two cases)', () => {
  it('puzzle-d3 is authored and has a reference solution', () => {
    expect(puzzle).toBeDefined();
    expect(puzzle && isAuthored(puzzle)).toBe(true);
  });

  if (!puzzle || !isAuthored(puzzle) || !puzzle.referenceSolution) {
    it.skip('reference solution missing — skipping', () => {});
    return;
  }

  const input = toValidationInput(puzzle);

  it('accepts the faithful inverse chain for BOTH cases', () => {
    const result = validatePuzzle(input, puzzle.referenceSolution!);
    expect(result.ok).toBe(true);
  });

  it('fails when the fake inverse q? is wired (passes case 3 but fails case 5)', () => {
    // f, g forward then the true g⁻¹ (p) but the fake f⁻¹ (q?): 3 returns, 5 lands on 7.
    const graph: PuzzleGraph = {
      nodes: [
        { kind: 'object', nodeId: 'n-a-start', objectId: 'obj-a', role: 'start' },
        { kind: 'morphism', nodeId: 'n-f', morphismId: 'mor-f' },
        { kind: 'object', nodeId: 'n-b1', objectId: 'obj-b' },
        { kind: 'morphism', nodeId: 'n-g', morphismId: 'mor-g' },
        { kind: 'object', nodeId: 'n-c', objectId: 'obj-c' },
        { kind: 'morphism', nodeId: 'n-p', morphismId: 'mor-p' },
        { kind: 'object', nodeId: 'n-b2', objectId: 'obj-b' },
        { kind: 'morphism', nodeId: 'n-qfake', morphismId: 'mor-qfake' },
        { kind: 'object', nodeId: 'n-a-goal', objectId: 'obj-a', role: 'goal' },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'n-a-start', targetNodeId: 'n-f' },
        { id: 'e2', sourceNodeId: 'n-f', targetNodeId: 'n-b1' },
        { id: 'e3', sourceNodeId: 'n-b1', targetNodeId: 'n-g' },
        { id: 'e4', sourceNodeId: 'n-g', targetNodeId: 'n-c' },
        { id: 'e5', sourceNodeId: 'n-c', targetNodeId: 'n-p' },
        { id: 'e6', sourceNodeId: 'n-p', targetNodeId: 'n-b2' },
        { id: 'e7', sourceNodeId: 'n-b2', targetNodeId: 'n-qfake' },
        { id: 'e8', sourceNodeId: 'n-qfake', targetNodeId: 'n-a-goal' },
      ],
    };
    const result = validatePuzzle(input, graph);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.firstFailure.rule.type).toBe('required-output');
  });
});
