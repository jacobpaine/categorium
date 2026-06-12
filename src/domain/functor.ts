/**
 * Functors — structure-preserving maps between two categories. Pure domain logic (no React).
 *
 * A functor F : C → D sends each object of C to an object of D and each morphism of C to a
 * morphism of D, such that F(f : A → B) : F(A) → F(B). This module checks a player-supplied
 * mapping against those laws. Like the rest of the engine it verifies STRUCTURE (endpoints line
 * up, the map is total), not semantics — composition/identity preservation is the law it teaches,
 * and source/target preservation is what it can mechanically enforce (a mis-pointed image fails).
 */
import type { CategoryObject, Morphism } from './types';
import { getMorphism, getObject } from './compose';

/** A small category: just its objects and morphisms (identities/composites included as morphisms). */
export type SmallCategory = { objects: CategoryObject[]; morphisms: Morphism[] };

/** The player's assignment: source id -> target id, for objects and morphisms. */
export type FunctorMapping = {
  objectMap: Record<string, string>;
  morphismMap: Record<string, string>;
};

export type FunctorViolation = {
  kind: 'object-total' | 'morphism-total' | 'object-target' | 'morphism-preservation';
  message: string;
};

function objLabel(cat: SmallCategory, id: string): string {
  return getObject(cat, id)?.formalLabel ?? id;
}
function morLabel(cat: SmallCategory, id: string): string {
  return getMorphism(cat, id)?.formalLabel ?? id;
}

/**
 * Verify a mapping is a functor C → D. Returns the violations in a stable order (the first is
 * surfaced to the player). Empty array means the mapping is a valid functor.
 */
export function checkFunctor(
  source: SmallCategory,
  target: SmallCategory,
  mapping: FunctorMapping,
): FunctorViolation[] {
  const violations: FunctorViolation[] = [];
  const targetObjectIds = new Set(target.objects.map((o) => o.id));

  // 1. Totality on objects + every image is a real target object.
  for (const o of source.objects) {
    const image = mapping.objectMap[o.id];
    if (image === undefined) {
      violations.push({ kind: 'object-total', message: `Object ${objLabel(source, o.id)} is not mapped yet.` });
    } else if (!targetObjectIds.has(image)) {
      violations.push({
        kind: 'object-target',
        message: `Object ${objLabel(source, o.id)} is mapped to something that isn't a target object.`,
      });
    }
  }

  // 2. Totality on morphisms.
  for (const m of source.morphisms) {
    if (mapping.morphismMap[m.id] === undefined) {
      violations.push({
        kind: 'morphism-total',
        message: `Morphism ${morLabel(source, m.id)} is not mapped yet.`,
      });
    }
  }

  // 3. Source/target preservation: F(f : A → B) must be a morphism F(A) → F(B).
  for (const m of source.morphisms) {
    const imageId = mapping.morphismMap[m.id];
    if (imageId === undefined) continue; // already reported as not-total
    const image = getMorphism(target, imageId);
    const mappedSource = mapping.objectMap[m.sourceObjectId];
    const mappedTarget = mapping.objectMap[m.targetObjectId];
    if (!image || mappedSource === undefined || mappedTarget === undefined) continue;
    if (image.sourceObjectId !== mappedSource || image.targetObjectId !== mappedTarget) {
      violations.push({
        kind: 'morphism-preservation',
        message:
          `${morLabel(source, m.id)} goes ${objLabel(source, m.sourceObjectId)} → ${objLabel(source, m.targetObjectId)}, ` +
          `so its image must go ${objLabel(target, mappedSource)} → ${objLabel(target, mappedTarget)}. ` +
          `${morLabel(target, imageId)} doesn't — the functor must preserve sources and targets.`,
      });
    }
  }

  return violations;
}

/** True iff the mapping is a valid functor C → D. */
export function isFunctor(source: SmallCategory, target: SmallCategory, mapping: FunctorMapping): boolean {
  return checkFunctor(source, target, mapping).length === 0;
}
