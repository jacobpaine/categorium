import { describe, it, expect } from 'vitest';
import type { Diagram, ThemeText } from './types';
import { checkParallel, arePathsEquivalent } from './equivalence';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });

// A commutative square: f;g and h;k both go A -> C.
const diagram: Diagram = {
  objects: ['A', 'B', 'C', 'D'].map((id) => ({ id, labels: t(id) })),
  morphisms: [
    { id: 'f', sourceObjectId: 'A', targetObjectId: 'B', labels: t('f') },
    { id: 'g', sourceObjectId: 'B', targetObjectId: 'C', labels: t('g') },
    { id: 'h', sourceObjectId: 'A', targetObjectId: 'D', labels: t('h') },
    { id: 'k', sourceObjectId: 'D', targetObjectId: 'C', labels: t('k') },
  ],
  paths: [
    { id: 'left', morphismIds: ['f', 'g'] },
    { id: 'right', morphismIds: ['h', 'k'] },
    { id: 'short', morphismIds: ['f'] },
  ],
};

const path = (id: string) => diagram.paths!.find((p) => p.id === id)!;

describe('path equivalence', () => {
  it('treats parallel paths (same source & target) as equivalent when declared', () => {
    const parallel = checkParallel(diagram, path('left'), path('right'));
    expect(parallel.ok).toBe(true);
    expect(arePathsEquivalent(diagram, path('left'), path('right'), true)).toBe(true);
  });

  it('never claims equivalence without the author declaration', () => {
    expect(arePathsEquivalent(diagram, path('left'), path('right'), false)).toBe(false);
  });

  it('rejects non-parallel paths even if declared equivalent', () => {
    expect(checkParallel(diagram, path('left'), path('short')).ok).toBe(false);
    expect(arePathsEquivalent(diagram, path('left'), path('short'), true)).toBe(false);
  });
});
