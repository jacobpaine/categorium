import { describe, it, expect } from 'vitest';
import type { ThemeText } from './types';
import type { SmallCategory } from './functor';
import { checkFunctor, isFunctor } from './functor';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });

// Source C: A --f--> B
const source: SmallCategory = {
  objects: [
    { id: 'A', formalLabel: 'A', labels: t('A') },
    { id: 'B', formalLabel: 'B', labels: t('B') },
  ],
  morphisms: [{ id: 'f', formalLabel: 'f', sourceObjectId: 'A', targetObjectId: 'B', labels: t('f') }],
};

// Target D: X --u--> Y, and a distractor v: Y -> X
const target: SmallCategory = {
  objects: [
    { id: 'X', formalLabel: 'X', labels: t('X') },
    { id: 'Y', formalLabel: 'Y', labels: t('Y') },
  ],
  morphisms: [
    { id: 'u', formalLabel: 'u', sourceObjectId: 'X', targetObjectId: 'Y', labels: t('u') },
    { id: 'v', formalLabel: 'v', sourceObjectId: 'Y', targetObjectId: 'X', labels: t('v') },
  ],
};

describe('checkFunctor', () => {
  it('accepts a structure-preserving mapping', () => {
    const mapping = { objectMap: { A: 'X', B: 'Y' }, morphismMap: { f: 'u' } };
    expect(checkFunctor(source, target, mapping)).toEqual([]);
    expect(isFunctor(source, target, mapping)).toBe(true);
  });

  it('rejects a mis-pointed image (preservation)', () => {
    // F(A)=X, F(B)=Y, but f -> v : Y -> X does not go X -> Y.
    const mapping = { objectMap: { A: 'X', B: 'Y' }, morphismMap: { f: 'v' } };
    const v = checkFunctor(source, target, mapping);
    expect(v[0]?.kind).toBe('morphism-preservation');
    expect(isFunctor(source, target, mapping)).toBe(false);
  });

  it('flags an incomplete mapping (totality)', () => {
    const mapping = { objectMap: { A: 'X' }, morphismMap: {} };
    const kinds = checkFunctor(source, target, mapping).map((x) => x.kind);
    expect(kinds).toContain('object-total');
    expect(kinds).toContain('morphism-total');
  });
});
