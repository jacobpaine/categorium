import { describe, it, expect } from 'vitest';
import { PUZZLES, getPuzzle, toValidationInput } from '../data';
import { isAuthored } from '../schemas';
import type { PuzzleGraph } from '../domain';
import { validatePuzzle } from './validatePuzzle';

/**
 * Build a graph from a puzzle's authored nodes plus a custom set of wires. Toolkit puzzles pin
 * only start/goal in `initialGraph`, so we take the node set from `referenceSolution` (which still
 * lists every authored object/morphism node, including distractors) and fall back to initialGraph.
 */
function wire(puzzleId: string, edges: [string, string][]): PuzzleGraph {
  const p = getPuzzle(puzzleId);
  if (!p || !isAuthored(p)) throw new Error(`fixture ${puzzleId}`);
  return {
    nodes: (p.referenceSolution ?? p.initialGraph).nodes,
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

  it('d4 (functor, multi-case): the faithful lifted line passes BOTH crates; a coincidental impostor lift passes only the starter', () => {
    const d4 = () => toValidationInput(getPuzzle('puzzle-d4') as never);
    // F(f) (+1) → F(g) (×2) → F(h) (+5) sends F(3) ↦ F(13) and F(4) ↦ F(15).
    const faithful = wire('puzzle-d4', [['n-fa', 'n-Ff'], ['n-Ff', 'n-fb'], ['n-fb', 'n-Fg'], ['n-Fg', 'n-fc'], ['n-fc', 'n-Fh'], ['n-Fh', 'n-fd']]);
    expect(validatePuzzle(d4(), faithful).ok).toBe(true);
    // 'Reset-to-4' (F(f)?) matches F(f) at F(3) (→F(4)) so the starter still reaches F(13), but F(4) stalls to F(4) and drifts to F(13) not F(15).
    const impostor = wire('puzzle-d4', [['n-fa', 'n-Ffbad'], ['n-Ffbad', 'n-fb'], ['n-fb', 'n-Fg'], ['n-Fg', 'n-fc'], ['n-fc', 'n-Fh'], ['n-Fh', 'n-fd']]);
    const res = validatePuzzle(d4(), impostor);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.firstFailure.rule.type).toBe('required-output');
      // It is the HEAVIER crate (F(4) ↦ F(15)) the impostor fails, not the starter.
      expect((res.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('box-a4');
    }
  });

  it('d1 (multi-case): the faithful chain passes BOTH batches; a coincidental impostor passes only the small one', () => {
    const d1 = () => toValidationInput(getPuzzle('puzzle-d1') as never);
    // f (+1) → g (×2) → h (+4) sends 2 ↦ 10 and 5 ↦ 16.
    const faithful = wire('puzzle-d1', [['n-a', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]);
    expect(validatePuzzle(d1(), faithful).ok).toBe(true);
    // 'Bump' (g?, +3) coincides with Double at 3 (→6) so batch 2 still reaches 10, but batch 5 drifts to 13.
    const impostor = wire('puzzle-d1', [['n-a', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-gbad'], ['n-gbad', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]);
    const res = validatePuzzle(d1(), impostor);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.firstFailure.rule.type).toBe('required-output');
      // It is the LARGE batch (5 ↦ 16) the impostor fails, not the small one.
      expect((res.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-a5');
    }
  });

  it('d2 (associativity, multi-case): every faithful grouping passes BOTH batches; the fabricating bundle passes only the near one', () => {
    const d2 = () => toValidationInput(getPuzzle('puzzle-d2') as never);
    // All three steps f (×2) → g (+3) → h (×2): 3 ↦ 18, 5 ↦ 26.
    const allSteps = wire('puzzle-d2', [['n-a', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g'], ['n-g', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]);
    expect(validatePuzzle(d2(), allSteps).ok).toBe(true);
    // Faithful bundle then step: (g∘f) → h reaches the same goals (associativity).
    const gfThenH = wire('puzzle-d2', [['n-a', 'n-gf'], ['n-gf', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]);
    expect(validatePuzzle(d2(), gfThenH).ok).toBe(true);
    // Step then faithful bundle: f → (h∘g) reaches the same goals (associativity).
    const fThenHg = wire('puzzle-d2', [['n-a', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-hg'], ['n-hg', 'n-d']]);
    expect(validatePuzzle(d2(), fThenHg).ok).toBe(true);
    // Fabricating bundle (g∘f)? (+6) → h: matches g∘f at 3 (→9→18) so case 1 passes, but 5→11→22 fails case 2.
    const fabricating = wire('puzzle-d2', [['n-a', 'n-gfbad'], ['n-gfbad', 'n-c'], ['n-c', 'n-h'], ['n-h', 'n-d']]);
    const res = validatePuzzle(d2(), fabricating);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.firstFailure.rule.type).toBe('required-output');
      // It is the FAR batch (5 ↦ 26) the fabricating bundle fails, not the near one.
      expect((res.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-a5');
    }
  });

  it('d5 (product+coproduct, multi-case): the case-split then pairing passes BOTH injections; a swapped/faking pairing fails, and a one-branch impostor passes only the card case', () => {
    const d5 = () => toValidationInput(getPuzzle('puzzle-d5') as never);
    // [f,g] (case-split) → ⟨p,q⟩ (pair y ↦ (y,2y)) sends ι₁ 3 ↦ (5,10) and ι₂ 4 ↦ (8,16).
    const faithful = wire('puzzle-d5', [['n-s', 'n-case'], ['n-case', 'n-y'], ['n-y', 'n-pair'], ['n-pair', 'n-p']]);
    expect(validatePuzzle(d5(), faithful).ok).toBe(true);
    // The case-split impostor [f,g′]? matches on ι₁ 3 (→5) so the card case still reaches (5,10),
    // but mishandles ι₂ 4 (→9), so the pairing lands on (9,18) and the cash case fails.
    const impostor = wire('puzzle-d5', [['n-s', 'n-casebad'], ['n-casebad', 'n-y'], ['n-y', 'n-pair'], ['n-pair', 'n-p']]);
    const resImp = validatePuzzle(d5(), impostor);
    expect(resImp.ok).toBe(false);
    if (!resImp.ok) {
      expect(resImp.firstFailure.rule.type).toBe('required-output');
      // It is the CASH case (ι₂ 4 ↦ (8,16)) the one-branch impostor fails, not the card case.
      expect((resImp.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-s-cash');
    }
    // The swapped pairing reverses the components and the faking pairing fakes the tax — both fail.
    for (const bad of ['n-pairswap', 'n-pairbad']) {
      const res = validatePuzzle(d5(), wire('puzzle-d5', [['n-s', 'n-case'], ['n-case', 'n-y'], ['n-y', bad], [bad, 'n-p']]));
      expect(res.ok, `${bad} should fail`).toBe(false);
      if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
    }
  });
});

describe('chapter 7 — monads (return, join, bind, short-circuit)', () => {
  it('m1: return wraps the value; Drop (empty box) is rejected', () => {
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-m1') as never), wire('puzzle-m1', [['n-a', 'n-return'], ['n-return', 'n-ta']])).ok).toBe(true);
    const drop = validatePuzzle(toValidationInput(getPuzzle('puzzle-m1') as never), wire('puzzle-m1', [['n-a', 'n-drop'], ['n-drop', 'n-ta']]));
    expect(drop.ok).toBe(false);
    if (!drop.ok) expect(drop.firstFailure.rule.type).toBe('required-output');
  });

  it('m3 (multi-case): the faithful bind passes both cases; a fabricating bind passes only the easy one', () => {
    const m3 = () => toValidationInput(getPuzzle('puzzle-m3') as never);
    expect(validatePuzzle(m3(), wire('puzzle-m3', [['n-a', 'n-f'], ['n-f', 'n-tb'], ['n-tb', 'n-bind'], ['n-bind', 'n-tc']])).ok).toBe(true);
    // 'Invent Host' (bindbad) produces Ada's host fine but fabricates one for Bo — the suite catches it.
    const inventing = validatePuzzle(m3(), wire('puzzle-m3', [['n-a', 'n-f'], ['n-f', 'n-tb'], ['n-tb', 'n-bindbad'], ['n-bindbad', 'n-tc']]));
    expect(inventing.ok).toBe(false);
    if (!inventing.ok) {
      expect(inventing.firstFailure.rule.type).toBe('required-output');
      // It is the SHORT-CIRCUIT case (Bo → Nothing) that fails, not the success case.
      expect((inventing.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-bo');
    }
  });

  it('m5: the List bind that flattens passes; non-flattening / lossy binds fail the non-empty case', () => {
    const m5 = () => toValidationInput(getPuzzle('puzzle-m5') as never);
    expect(validatePuzzle(m5(), wire('puzzle-m5', [['n-la', 'n-bind'], ['n-bind', 'n-lb']])).ok).toBe(true);
    for (const bad of ['n-bindnest', 'n-bindfirst']) {
      const res = validatePuzzle(m5(), wire('puzzle-m5', [['n-la', bad], [bad, 'n-lb']]));
      expect(res.ok, `${bad} should fail`).toBe(false);
      if (!res.ok) expect((res.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-tags');
    }
  });

  it('m4: the honest chain short-circuits to Nothing; an inventing bind is rejected', () => {
    const honest = wire('puzzle-m4', [['n-a', 'n-email'], ['n-email', 'n-tb'], ['n-tb', 'n-host'], ['n-host', 'n-tc'], ['n-tc', 'n-domain'], ['n-domain', 'n-td']]);
    expect(validatePuzzle(toValidationInput(getPuzzle('puzzle-m4') as never), honest).ok).toBe(true);
    const invents = wire('puzzle-m4', [['n-a', 'n-email'], ['n-email', 'n-tb'], ['n-tb', 'n-host'], ['n-host', 'n-tc'], ['n-tc', 'n-domainbad'], ['n-domainbad', 'n-td']]);
    const res = validatePuzzle(toValidationInput(getPuzzle('puzzle-m4') as never), invents);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('d7 (four-step, five-case): the faithful chain short-circuits at every depth; the step-4 fabricating bind passes the success and the shallow failures but fails ONLY the deepest empty case', () => {
    const d7 = () => toValidationInput(getPuzzle('puzzle-d7') as never);
    // f → bind g → bind h → bind k : Ada ↦ Just registrar, and Bo/Cy/Di/Eve ↦ Nothing.
    const faithful = wire('puzzle-d7', [
      ['n-a', 'n-email'], ['n-email', 'n-tb'],
      ['n-tb', 'n-host'], ['n-host', 'n-tc'],
      ['n-tc', 'n-domain'], ['n-domain', 'n-td'],
      ['n-td', 'n-registrar'], ['n-registrar', 'n-te'],
    ]);
    expect(validatePuzzle(d7(), faithful).ok).toBe(true);

    // The reference solution (lists every authored node incl. distractors) also validates.
    const ref = (getPuzzle('puzzle-d7') as never as { referenceSolution: PuzzleGraph }).referenceSolution;
    expect(validatePuzzle(d7(), ref).ok).toBe(true);

    // 'Invent Registrar' passes Nothing through and reads Ada's real registrar, so it clears the
    // success AND the step-1/2/3 failures; it fabricates only when emptiness first arises at step 4 (Eve).
    const fabricating = wire('puzzle-d7', [
      ['n-a', 'n-email'], ['n-email', 'n-tb'],
      ['n-tb', 'n-host'], ['n-host', 'n-tc'],
      ['n-tc', 'n-domain'], ['n-domain', 'n-td'],
      ['n-td', 'n-registrarbad'], ['n-registrarbad', 'n-te'],
    ]);
    const res2 = validatePuzzle(d7(), fabricating);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.firstFailure.rule.type).toBe('required-output');
      // It is the DEEPEST empty case (Eve, no registrar at step 4) the fabricating bind fails.
      expect((res2.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-eve');
    }
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

  it('d8 (multi-case pullback): the key-respecting join passes BOTH cases; Force-Join passes only the matching one', () => {
    const d8 = () => toValidationInput(getPuzzle('puzzle-d8') as never);
    // u (join on key) → p₂ (read customer) sends the matching request (3,3) ↦ 3 AND the
    // mismatched request (3,9) ↦ ⊥ (the no-match marker — the pullback refuses to fabricate a pair).
    const faithful = wire('puzzle-d8', [['n-x', 'n-u'], ['n-u', 'n-p'], ['n-p', 'n-p2'], ['n-p2', 'n-b']]);
    expect(validatePuzzle(d8(), faithful).ok).toBe(true);
    // 'Force-Join' (u?) builds (3,3) on the matching request — so case 1 still reaches 3 — but
    // force-fits (3,9) on the mismatched request, projecting to 9 instead of ⊥.
    const forcedJoin = wire('puzzle-d8', [['n-x', 'n-uforce'], ['n-uforce', 'n-p'], ['n-p', 'n-p2'], ['n-p2', 'n-b']]);
    const res = validatePuzzle(d8(), forcedJoin);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.firstFailure.rule.type).toBe('required-output');
      // It is the INCONSISTENT request (3,9 ↦ ⊥) the impostor fails, not the matching one.
      expect((res.firstFailure.rule as { inputValueId: string }).inputValueId).toBe('v-x-incon');
    }
    // The loose join (u??) ignores the key entirely and fails even the matching case.
    const loose = wire('puzzle-d8', [['n-x', 'n-uloose'], ['n-uloose', 'n-p'], ['n-p', 'n-p2'], ['n-p2', 'n-b']]);
    expect(validatePuzzle(d8(), loose).ok).toBe(false);
  });
});
