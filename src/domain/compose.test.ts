import { describe, it, expect } from 'vitest';
import type { Diagram, ThemeText } from './types';
import { isComposable, composeMorphisms, composePath } from './compose';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });

const diagram: Diagram = {
  objects: [
    { id: 'A', labels: t('A') },
    { id: 'B', labels: t('B') },
    { id: 'C', labels: t('C') },
  ],
  morphisms: [
    { id: 'f', sourceObjectId: 'A', targetObjectId: 'B', labels: t('f') },
    { id: 'g', sourceObjectId: 'B', targetObjectId: 'C', labels: t('g') },
    { id: 'idA', sourceObjectId: 'A', targetObjectId: 'A', labels: t('idA') },
  ],
};

describe('composition', () => {
  it('composes a valid chain into A -> C', () => {
    expect(isComposable(diagram, ['f', 'g'])).toBe(true);
    const r = composeMorphisms(diagram, ['f', 'g']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.sourceObjectId).toBe('A');
      expect(r.value.targetObjectId).toBe('C');
      expect(r.value.morphismIds).toEqual(['f', 'g']);
    }
  });

  it('rejects a type-mismatched chain', () => {
    // target(f) = B but source(f) = A, so [f, f] is not composable.
    expect(isComposable(diagram, ['f', 'f'])).toBe(false);
    const r = composeMorphisms(diagram, ['f', 'f']);
    expect(r.ok).toBe(false);
  });

  it('composes an identity morphism A -> A', () => {
    const r = composeMorphisms(diagram, ['idA']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.sourceObjectId).toBe('A');
      expect(r.value.targetObjectId).toBe('A');
    }
  });

  it('reports the overall endpoints of a longer path via composePath', () => {
    const r = composePath(diagram, { id: 'p', morphismIds: ['idA', 'f', 'g'] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.sourceObjectId).toBe('A');
      expect(r.value.targetObjectId).toBe('C');
    }
  });

  it('fails on an empty chain and on unknown morphisms', () => {
    expect(composeMorphisms(diagram, []).ok).toBe(false);
    expect(composeMorphisms(diagram, ['nope']).ok).toBe(false);
  });
});
