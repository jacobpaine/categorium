import { describe, it, expect } from 'vitest';
import { PUZZLES, getPuzzle } from '../data';
import { isFunctorPuzzle } from '../schemas';
import { validateFunctor } from './validateFunctor';

describe('functor puzzles — reference mappings are valid functors', () => {
  const functorPuzzles = PUZZLES.filter(isFunctorPuzzle);

  it('there are functor puzzles to check', () => {
    expect(functorPuzzles.length).toBeGreaterThan(0);
  });

  for (const p of functorPuzzles) {
    it(p.id, () => {
      const res = validateFunctor(p.sourceCategory, p.targetCategory, p.referenceMapping);
      expect(res.ok).toBe(true);
    });
  }
});

describe('puzzle-15 — composition preservation fails on a mis-pointed composite', () => {
  it('mapping g∘f to F(f) (wrong endpoints) is rejected', () => {
    const p = getPuzzle('puzzle-15');
    if (!p || !isFunctorPuzzle(p)) throw new Error('fixture');
    const bad = {
      objectMap: p.referenceMapping.objectMap,
      // mor-gf : A → C must map to an F(A) → F(C) arrow; tmor-u is F(A) → F(B).
      morphismMap: { ...p.referenceMapping.morphismMap, 'mor-gf': 'tmor-u' },
    };
    const res = validateFunctor(p.sourceCategory, p.targetCategory, bad);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.nearConcept).toBe('functor');
  });
});
