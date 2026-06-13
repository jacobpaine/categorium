import { describe, it, expect } from 'vitest';
import { TOUR, toValidationInput } from '../data';
import { validatePuzzle } from './validatePuzzle';
import type { ConceptTag } from './rules';

describe('the introduction tour ("Chapter 0")', () => {
  it('has the five core steps in order', () => {
    expect(TOUR.map((s) => s.id)).toEqual(['tour-1', 'tour-2', 'tour-3', 'tour-4', 'tour-5']);
  });

  it('every step is a behavior puzzle (samples + required-output)', () => {
    for (const step of TOUR) {
      expect(step.samples?.length ?? 0).toBeGreaterThan(0);
      expect(step.validation.some((r) => r.type === 'required-output')).toBe(true);
    }
  });

  it("every step's reference solution passes validation", () => {
    for (const step of TOUR) {
      expect(step.referenceSolution, `${step.id} needs a reference solution`).toBeDefined();
      const res = validatePuzzle(toValidationInput(step), step.referenceSolution!);
      expect(res.ok, `${step.id} reference solution should pass`).toBe(true);
    }
  });

  it('covers the confusing core concepts the tour promises to teach', () => {
    const taught = new Set<ConceptTag>(TOUR.flatMap((s) => s.conceptTags));
    for (const concept of ['morphism', 'composition', 'identity', 'isomorphism', 'functor'] as const) {
      expect(taught.has(concept), `tour should teach ${concept}`).toBe(true);
    }
  });

  it('completing the tour unlocks glossary entries for each concept', () => {
    const unlocks = new Set(TOUR.flatMap((s) => s.glossaryUnlocks));
    for (const id of ['object', 'morphism', 'composition', 'identity', 'isomorphism', 'inverse', 'functor']) {
      expect(unlocks.has(id), `tour should unlock glossary '${id}'`).toBe(true);
    }
  });
});

describe('tour wrong-answer behavior (the distractors really fail)', () => {
  function stepInput(id: string) {
    const step = TOUR.find((s) => s.id === id)!;
    return { step, input: toValidationInput(step) };
  }
  function graph(id: string, edges: [string, string][]) {
    const step = TOUR.find((s) => s.id === id)!;
    return {
      nodes: step.initialGraph.nodes,
      edges: edges.map(([s, t], i) => ({ id: `e${i}`, sourceNodeId: s, targetNodeId: t })),
    };
  }

  it('tour-1: the wrecking machine produces the wrong value', () => {
    const { input } = stepInput('tour-1');
    const res = validatePuzzle(input, graph('tour-1', [['n-a', 'n-g'], ['n-g', 'n-b']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('tour-3: the smudging self-loop fails the do-nothing requirement', () => {
    const { input } = stepInput('tour-3');
    const res = validatePuzzle(input, graph('tour-3', [['n-a-start', 'n-smudge'], ['n-smudge', 'n-a-goal']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('tour-4: the lossy decoder does not restore the original', () => {
    const { input } = stepInput('tour-4');
    const res = validatePuzzle(
      input,
      graph('tour-4', [['n-a-start', 'n-f'], ['n-f', 'n-b'], ['n-b', 'n-g1'], ['n-g1', 'n-a-goal']]),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });

  it('tour-5: the impostor lift crumples the batch', () => {
    const { input } = stepInput('tour-5');
    const res = validatePuzzle(input, graph('tour-5', [['n-fa', 'n-Ffbad'], ['n-Ffbad', 'n-fb']]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});
