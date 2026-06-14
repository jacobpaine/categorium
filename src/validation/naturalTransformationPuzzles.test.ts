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

describe('puzzle-c6 — naturality must hold across BOTH squares', () => {
  function components(map: Record<string, string>) {
    const p = getPuzzle('puzzle-c6');
    if (!p || !isNaturalTransformationPuzzle(p)) throw new Error('fixture');
    return validateNaturalTransformation(p.sourceCategory, p.targetCategory, p.functorF, p.functorG, map);
  }

  it('all-safeHead is natural across the three-object chain', () => {
    expect(components({ 'obj-a': 'd-shA', 'obj-b': 'd-shB', 'obj-c': 'd-shC' }).ok).toBe(true);
  });

  it('one cheating component anywhere breaks a square', () => {
    const res = components({ 'obj-a': 'd-shA', 'obj-b': 'd-shB', 'obj-c': 'd-bdC' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.violations.some((v) => v.kind === 'naturality')).toBe(true);
  });

  it('all-headOrDefault breaks both squares', () => {
    expect(components({ 'obj-a': 'd-bdA', 'obj-b': 'd-bdB', 'obj-c': 'd-bdC' }).ok).toBe(false);
  });
});
