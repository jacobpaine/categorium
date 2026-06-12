import { describe, it, expect } from 'vitest';
import { PUZZLES, getPuzzle, toValidationInput } from '../data';
import { isAuthored } from '../schemas';
import type { PuzzleGraph } from '../domain';
import { validatePuzzle } from './validatePuzzle';

/** Build a graph from a puzzle's initial nodes plus a custom set of wires. */
function wire(puzzleId: string, edges: [string, string][]): PuzzleGraph {
  const p = getPuzzle(puzzleId);
  if (!p || !isAuthored(p)) throw new Error(`fixture ${puzzleId}`);
  return {
    nodes: p.initialGraph.nodes,
    edges: edges.map(([s, t], i) => ({ id: `e${i}`, sourceNodeId: s, targetNodeId: t })),
  };
}

describe('reference solutions pass for every authored puzzle', () => {
  for (const puzzle of PUZZLES) {
    if (!isAuthored(puzzle) || !puzzle.referenceSolution) continue;
    it(`${puzzle.id}`, () => {
      const res = validatePuzzle(toValidationInput(puzzle), puzzle.referenceSolution!);
      expect(res.ok).toBe(true);
    });
  }
});

describe('puzzle-02 — typed transformation', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-02') as never);

  it('rejects a wrong-output machine on a type-mismatch', () => {
    // mor-bad-out: A -> C, so wiring it into B is a type error.
    const res = validatePuzzle(input(), wire('puzzle-02', [['n-a', 'n-bad-out'], ['n-bad-out', 'n-b']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });

  it('rejects a wrong-input machine on a type-mismatch', () => {
    // mor-bad-in: C -> B, so feeding A into it is a type error.
    const res = validatePuzzle(input(), wire('puzzle-02', [['n-a', 'n-bad-in'], ['n-bad-in', 'n-b']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });
});

describe('puzzle-04 — identity', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-04') as never);

  it('rejects the distractor f (A -> B) because it cannot reach goal A', () => {
    const res = validatePuzzle(
      input(),
      wire('puzzle-04', [['n-a-start', 'n-f'], ['n-f', 'n-a-goal']]),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });

  it('rejects a direct thing-to-thing wire (no machine)', () => {
    const res = validatePuzzle(input(), wire('puzzle-04', [['n-a-start', 'n-a-goal']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });
});

describe('puzzle-05 — commutative diagram', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-05') as never);

  it('fails to reach the goal when no second path is built', () => {
    const res = validatePuzzle(input(), wire('puzzle-05', []));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-final-object');
  });
});

describe('puzzle-06 — identity law', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-06') as never);

  it('requires the do-nothing step: skipping id_A fails the concept rule', () => {
    // A -> f -> B reaches the goal but never uses the identity step.
    const res = validatePuzzle(input(), wire('puzzle-06', [['n-a', 'n-f'], ['n-f', 'n-b']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('concept-tag-required');
  });
});

describe('puzzle-12 — isomorphism (choose the true inverse)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-12') as never);

  it('rejects the lossy machine that cannot return to the start (type mismatch)', () => {
    // mor-bad: B -> C, so wiring it into the goal A is ill-typed.
    const res = validatePuzzle(
      input(),
      wire('puzzle-12', [['n-a-start', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-bad'], ['n-bad', 'n-a-goal']]),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });
});

describe('puzzle-09 — associativity', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-09') as never);

  it('rejects wiring the g∘f bundle straight to the goal (type mismatch)', () => {
    // mor-gf outputs C, but the goal node is D, so this wire is ill-typed.
    const res = validatePuzzle(input(), wire('puzzle-09', [['n-a', 'n-gf'], ['n-gf', 'n-d']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });

  it('fails to reach the goal when nothing is wired', () => {
    const res = validatePuzzle(input(), wire('puzzle-09', []));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-final-object');
  });
});
