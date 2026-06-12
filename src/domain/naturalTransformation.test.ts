import { describe, it, expect } from 'vitest';
import type { ThemeText } from './types';
import type { SmallCategory, FunctorMapping } from './functor';
import type { CategoryWithComposition } from './naturalTransformation';
import { checkNaturalTransformation, isNaturalTransformation } from './naturalTransformation';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });
const obj = (id: string) => ({ id, formalLabel: id, labels: t(id) });
const mor = (id: string, s: string, tg: string) => ({ id, formalLabel: id, sourceObjectId: s, targetObjectId: tg, labels: t(id) });

// C:  A --f--> B
const C: SmallCategory = { objects: [obj('A'), obj('B')], morphisms: [mor('f', 'A', 'B')] };

// D contains List/Optional images, the safeHead components, a non-natural distractor, and the
// composites needed for the naturality square.
const D: CategoryWithComposition = {
  objects: ['LA', 'LB', 'OA', 'OB'].map(obj),
  morphisms: [
    mor('mapf', 'LA', 'LB'),
    mor('mapOf', 'OA', 'OB'),
    mor('shA', 'LA', 'OA'), // safeHead_A
    mor('shB', 'LB', 'OB'), // safeHead_B
    mor('badA', 'LA', 'OA'), // typed correctly but not natural
    mor('badB', 'LB', 'OB'),
    mor('diag', 'LA', 'OB'),
    mor('diag2', 'LA', 'OB'),
    mor('diag3', 'LA', 'OB'),
  ],
  composites: [
    { first: 'mapf', second: 'shB', result: 'diag' }, // safeHead_B ∘ map f
    { first: 'shA', second: 'mapOf', result: 'diag' }, // map? f ∘ safeHead_A  → same → natural
    { first: 'mapf', second: 'badB', result: 'diag2' },
    { first: 'badA', second: 'mapOf', result: 'diag3' }, // diag2 ≠ diag3 → not natural
  ],
};

const F: FunctorMapping = { objectMap: { A: 'LA', B: 'LB' }, morphismMap: { f: 'mapf' } };
const G: FunctorMapping = { objectMap: { A: 'OA', B: 'OB' }, morphismMap: { f: 'mapOf' } };

describe('checkNaturalTransformation', () => {
  it('accepts safeHead : List ⇒ Optional (the square commutes)', () => {
    expect(isNaturalTransformation(C, D, F, G, { A: 'shA', B: 'shB' })).toBe(true);
  });

  it('rejects a correctly-typed but non-natural family', () => {
    const v = checkNaturalTransformation(C, D, F, G, { A: 'badA', B: 'badB' });
    expect(v[0]?.kind).toBe('naturality');
  });

  it('flags a mistyped component', () => {
    // mapf : LA → LB, but the component at A must be LA → OA.
    const v = checkNaturalTransformation(C, D, F, G, { A: 'mapf', B: 'shB' });
    expect(v.some((x) => x.kind === 'component-typing')).toBe(true);
  });

  it('flags a missing component', () => {
    const v = checkNaturalTransformation(C, D, F, G, { A: 'shA' });
    expect(v.some((x) => x.kind === 'component-total')).toBe(true);
  });
});
