import { describe, it, expect } from 'vitest';
import { PUZZLES, getPuzzle } from '../data';
import { isNaturalTransformationPuzzle } from '../schemas';
import { validateNaturalTransformation } from './validateNaturalTransformation';

describe('natural-transformation puzzles — reference components are natural', () => {
  const ntPuzzles = PUZZLES.filter(isNaturalTransformationPuzzle);

  it('there are natural-transformation puzzles to check', () => {
    expect(ntPuzzles.length).toBeGreaterThan(0);
  });

  for (const p of ntPuzzles) {
    it(p.id, () => {
      const res = validateNaturalTransformation(
        p.sourceCategory,
        p.targetCategory,
        p.functorF,
        p.functorG,
        p.referenceComponents,
      );
      expect(res.ok).toBe(true);
    });
  }
});

describe('puzzle-22 — naturality is genuinely checked', () => {
  it('the typed-but-non-natural family (headOrDefault) is rejected', () => {
    const p = getPuzzle('puzzle-22');
    if (!p || !isNaturalTransformationPuzzle(p)) throw new Error('fixture');
    const res = validateNaturalTransformation(p.sourceCategory, p.targetCategory, p.functorF, p.functorG, {
      'obj-a': 'd-bdA',
      'obj-b': 'd-bdB',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.firstFailure.nearConcept).toBe('natural-transformation');
      expect(res.violations.some((v) => v.kind === 'naturality')).toBe(true);
    }
  });
});
