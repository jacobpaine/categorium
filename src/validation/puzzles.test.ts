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

describe('puzzle-14 — functor lift (behavior)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-14') as never);

  it('the faithful lift F(f) produces the cleaned batch', () => {
    expect(validatePuzzle(input(), wire('puzzle-14', [['n-fa', 'n-Ff'], ['n-Ff', 'n-fb']])).ok).toBe(true);
  });

  it('the impostor lift (same type) produces the wrong batch', () => {
    const res = validatePuzzle(input(), wire('puzzle-14', [['n-fa', 'n-Ffbad'], ['n-Ffbad', 'n-fb']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('puzzle-16 — functor preserves identity (behavior)', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-16') as never);

  it('the tampering identity-lift makes F(f) jam', () => {
    const res = validatePuzzle(input(), wire('puzzle-16', [['n-fa', 'n-tamper'], ['n-tamper', 'n-Ff'], ['n-Ff', 'n-fb']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('skipping the lifted identity fails the identity requirement', () => {
    const res = validatePuzzle(input(), wire('puzzle-16', [['n-fa', 'n-Ff'], ['n-Ff', 'n-fb']]));
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

describe('capstones — the harder end-of-chapter puzzles really resist shortcuts', () => {
  it('c1: the faithful 3-step chain solves; the one-step shortcut does not', () => {
    const ok = validatePuzzle(
      toValidationInput(getPuzzle('puzzle-c1') as never),
      wire('puzzle-c1', [['n-a', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]),
    );
    expect(ok.ok).toBe(true);
    // The one-step shortcut is rejected: it's a single arrow (not a composition) AND its value is wrong.
    const shortcut = validatePuzzle(toValidationInput(getPuzzle('puzzle-c1') as never), wire('puzzle-c1', [['n-a', 'n-quick'], ['n-quick', 'n-d']]));
    expect(shortcut.ok).toBe(false);
    // And the wrong machine at a stage produces the wrong report (behavior failure).
    const wrongStage = validatePuzzle(toValidationInput(getPuzzle('puzzle-c1') as never), wire('puzzle-c1', [['n-a', 'n-fbad'], ['n-fbad', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]));
    expect(wrongStage.ok).toBe(false);
    if (!wrongStage.ok) expect(wrongStage.firstFailure.rule.type).toBe('required-output');
  });

  it('c2: a buggy pre-bundle fails; both stepwise and bundled faithful routes pass', () => {
    const buggy = validatePuzzle(toValidationInput(getPuzzle('puzzle-c2') as never), wire('puzzle-c2', [['n-a', 'n-gfbad'], ['n-gfbad', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]));
    expect(buggy.ok).toBe(false);
    const bundled = validatePuzzle(toValidationInput(getPuzzle('puzzle-c2') as never), wire('puzzle-c2', [['n-a', 'n-gf'], ['n-gf', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]));
    expect(bundled.ok).toBe(true);
  });

  it('c3: the lossy decoder fails to restore the original after the two-step encode', () => {
    const res = validatePuzzle(
      toValidationInput(getPuzzle('puzzle-c3') as never),
      wire('puzzle-c3', [['n-a-start', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-c'], ['n-c', 'n-dbad'], ['n-dbad', 'n-a-goal']]),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('c4: an impostor lift jams the rest of the lifted pipeline', () => {
    const res = validatePuzzle(toValidationInput(getPuzzle('puzzle-c4') as never), wire('puzzle-c4', [['n-fa', 'n-Ffbad'], ['n-Ffbad', 'n-fb'], ['n-fb', 'n-Fg'], ['n-Fg', 'n-fc']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('c5: a swapped pairing makes the projection return the wrong component', () => {
    const res = validatePuzzle(toValidationInput(getPuzzle('puzzle-c5') as never), wire('puzzle-c5', [['n-x', 'n-pairbad'], ['n-pairbad', 'n-p'], ['n-p', 'n-pi1'], ['n-pi1', 'n-a']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('chapter 7 — monads (return, join, bind, short-circuit)', () => {
  it('m1: return wraps the value; Drop (empty box) is rejected', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-m1') as never), wire('puzzle-m1', [['n-a', 'n-return'], ['n-return', 'n-ta']])).ok).toBe(true);
    const drop = validatePuzzle(toValidationInput(getPuzzle('puzzle-m1') as never), wire('puzzle-m1', [['n-a', 'n-drop'], ['n-drop', 'n-ta']]));
    expect(drop.ok).toBe(false);
    if (!drop.ok) expect(drop.firstFailure.rule.type).toBe('required-output');
  });

  it('m3: chaining the honest lookup + faithful bind reaches the host; impostors do not', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-m3') as never), wire('puzzle-m3', [['n-a', 'n-f'], ['n-f', 'n-tb'], ['n-tb', 'n-bind'], ['n-bind', 'n-tc']])).ok).toBe(true);
    const fabricated = validatePuzzle(toValidationInput(getPuzzle('puzzle-m3') as never), wire('puzzle-m3', [['n-a', 'n-fbad'], ['n-fbad', 'n-tb'], ['n-tb', 'n-bind'], ['n-bind', 'n-tc']]));
    expect(fabricated.ok).toBe(false);
    if (!fabricated.ok) expect(fabricated.firstFailure.rule.type).toBe('required-output');
  });

  it('m4: the honest chain short-circuits to Nothing; an inventing bind is rejected', () => {
    const honest = wire('puzzle-m4', [['n-a', 'n-email'], ['n-email', 'n-tb'], ['n-tb', 'n-host'], ['n-host', 'n-tc'], ['n-tc', 'n-domain'], ['n-domain', 'n-td']]);
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-m4') as never), honest).ok).toBe(true);
    const invents = wire('puzzle-m4', [['n-a', 'n-email'], ['n-email', 'n-tb'], ['n-tb', 'n-host'], ['n-host', 'n-tc'], ['n-tc', 'n-domainbad'], ['n-domainbad', 'n-td']]);
    const res = validatePuzzle(toValidationInput(getPuzzle('puzzle-m4') as never), invents);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});

describe('chapter 8 — limits (terminal, equalizer, pullback, universal property)', () => {
  it('l1: the collapse solves; the information-keeping map jams', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-l1') as never), wire('puzzle-l1', [['n-a', 'n-collapse'], ['n-collapse', 'n-1']])).ok).toBe(true);
    const hold = validatePuzzle(toValidationInput(getPuzzle('puzzle-l1') as never), wire('puzzle-l1', [['n-a', 'n-hold'], ['n-hold', 'n-1']]));
    expect(hold.ok).toBe(false);
    if (!hold.ok) expect(hold.firstFailure.rule.type).toBe('required-output');
  });

  it('l2: the matching inclusion reaches the agreed value via either query; a mismatched one does not', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-l2') as never), wire('puzzle-l2', [['n-e', 'n-include'], ['n-include', 'n-a'], ['n-a', 'n-bill'], ['n-bill', 'n-b']])).ok).toBe(true);
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-l2') as never), wire('puzzle-l2', [['n-e', 'n-include'], ['n-include', 'n-a'], ['n-a', 'n-ship'], ['n-ship', 'n-b']])).ok).toBe(true);
    const mismatch = validatePuzzle(toValidationInput(getPuzzle('puzzle-l2') as never), wire('puzzle-l2', [['n-e', 'n-includebad'], ['n-includebad', 'n-a'], ['n-a', 'n-bill'], ['n-bill', 'n-b']]));
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.firstFailure.rule.type).toBe('required-output');
  });

  it('l3: the key-respecting join recovers the customer; a loose join returns a stranger', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-l3') as never), wire('puzzle-l3', [['n-x', 'n-join'], ['n-join', 'n-p'], ['n-p', 'n-proj'], ['n-proj', 'n-b']])).ok).toBe(true);
    const loose = validatePuzzle(toValidationInput(getPuzzle('puzzle-l3') as never), wire('puzzle-l3', [['n-x', 'n-joinloose'], ['n-joinloose', 'n-p'], ['n-p', 'n-proj'], ['n-proj', 'n-b']]));
    expect(loose.ok).toBe(false);
    if (!loose.ok) expect(loose.firstFailure.rule.type).toBe('required-output');
  });

  it('l4: only the unique mediating map reaches the goal; a force-fit map fails', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-l4') as never), wire('puzzle-l4', [['n-x', 'n-u'], ['n-u', 'n-p'], ['n-p', 'n-p2'], ['n-p2', 'n-b'], ['n-b', 'n-region'], ['n-region', 'n-d']])).ok).toBe(true);
    const forced = validatePuzzle(toValidationInput(getPuzzle('puzzle-l4') as never), wire('puzzle-l4', [['n-x', 'n-u1'], ['n-u1', 'n-p'], ['n-p', 'n-p2'], ['n-p2', 'n-b'], ['n-b', 'n-region'], ['n-region', 'n-d']]));
    expect(forced.ok).toBe(false);
    if (!forced.ok) expect(forced.firstFailure.rule.type).toBe('required-output');
  });
});
