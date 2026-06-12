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

describe('puzzle-05 — commutative diagram (behavior)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-05') as never);

  it('fails required-output when no second route is built', () => {
    const res = validatePuzzle(input(), wire('puzzle-05', []));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('rejects the route that produces a different value (Skewer)', () => {
    // h then k′ : raw → sample → a DIFFERENT report.
    const res = validatePuzzle(input(), wire('puzzle-05', [['n-a', 'n-h'], ['n-h', 'n-d'], ['n-d', 'n-skew'], ['n-skew', 'n-c']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
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

describe('puzzle-03 — composition by behavior', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-03') as never);

  it('the correct behavior chain (Parser then Charter) produces the goal value', () => {
    const res = validatePuzzle(input(), wire('puzzle-03', [['n-a', 'n-parser'], ['n-parser', 'n-b'], ['n-b', 'n-charter'], ['n-charter', 'n-c']]));
    expect(res.ok).toBe(true);
  });

  it('a wrong intermediate jams the second machine (Shredder then Charter)', () => {
    const res = validatePuzzle(input(), wire('puzzle-03', [['n-a', 'n-shred'], ['n-shred', 'n-b'], ['n-b', 'n-charter'], ['n-charter', 'n-c']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('a type-valid chain that produces the wrong chart is rejected (Parser then Scribbler)', () => {
    const res = validatePuzzle(input(), wire('puzzle-03', [['n-a', 'n-parser'], ['n-parser', 'n-b'], ['n-b', 'n-scribbler'], ['n-scribbler', 'n-c']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('puzzle-17 — product (project out)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-17') as never);

  it('rejects the wrong projection (π₂ lands at B, not the goal A)', () => {
    // mor-pi2 : A×B → B, so wiring it into the goal A is ill-typed.
    const res = validatePuzzle(input(), wire('puzzle-17', [['n-p', 'n-pi2'], ['n-pi2', 'n-a']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('type-valid-wiring');
  });

  it('rejects the look-alike projection that returns the wrong name', () => {
    const res = validatePuzzle(input(), wire('puzzle-17', [['n-p', 'n-pi1bad'], ['n-pi1bad', 'n-a']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('puzzle-19 — coproduct must handle BOTH cases', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-19') as never);

  it('the genuine case-split handles card and cash', () => {
    expect(validatePuzzle(input(), wire('puzzle-19', [['n-s', 'n-case'], ['n-case', 'n-y']])).ok).toBe(true);
  });

  it('the look-alike that mishandles the card case is rejected', () => {
    const res = validatePuzzle(input(), wire('puzzle-19', [['n-s', 'n-casebad'], ['n-casebad', 'n-y']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('puzzle-12 — isomorphism (choose the true inverse)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-12') as never);

  it('accepts only the decoder whose round trip restores the original value', () => {
    const ok = validatePuzzle(input(), wire('puzzle-12', [['n-a-start', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-a-goal']]));
    expect(ok.ok).toBe(true);
  });

  it('rejects a same-typed decoder that returns a different value (g₁)', () => {
    const res = validatePuzzle(input(), wire('puzzle-12', [['n-a-start', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g1'], ['n-g1', 'n-a-goal']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
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

  it('the fake composite produces the wrong value, so the report never appears', () => {
    // mor-gfbad : A→C but ≠ g∘f, so it makes the wrong chart and Reporter jams / wrong output.
    const res = validatePuzzle(input(), wire('puzzle-09', [['n-a', 'n-gfbad'], ['n-gfbad', 'n-h'], ['n-h', 'n-d']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});
