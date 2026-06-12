/**
 * Natural transformations — the morphisms of a functor category [C, D]. Pure domain logic.
 *
 * A natural transformation α : F ⇒ G (between functors F, G : C → D) is a family of *component*
 * morphisms α_A : F(A) → G(A), one per object A of C, such that every naturality square commutes:
 *
 *      F(A) --F(f)--> F(B)
 *       |              |
 *      α_A            α_B
 *       v              v
 *      G(A) --G(f)--> G(B)        i.e.   α_B ∘ F(f) = G(f) ∘ α_A   for every f : A → B in C.
 *
 * Unlike the declared `path-equivalence` used elsewhere, naturality here is checked GENUINELY: the
 * target category D carries a (partial) composition table, and the engine computes both composites
 * and compares them. A correctly-typed but non-natural family really fails.
 */
import { getMorphism, getObject } from './compose';
import type { SmallCategory, FunctorMapping } from './functor';

/** `result = second ∘ first` — do `first`, then `second`. */
export type CompositionEntry = { first: string; second: string; result: string };

/** A category D plus enough of its composition table to check naturality squares. */
export type CategoryWithComposition = SmallCategory & { composites: CompositionEntry[] };

/** The player's transformation: C-objectId → D-morphismId (the component α_A at each object). */
export type NaturalTransformation = { components: Record<string, string> };

export type NaturalityViolation = {
  kind: 'component-total' | 'component-typing' | 'naturality';
  message: string;
};

/** Look up `second ∘ first` in a composition table. */
export function composeIn(
  composites: CompositionEntry[],
  first: string,
  second: string,
): string | undefined {
  return composites.find((c) => c.first === first && c.second === second)?.result;
}

const objLabel = (cat: SmallCategory, id: string) => getObject(cat, id)?.formalLabel ?? id;
const morLabel = (cat: SmallCategory, id: string) => getMorphism(cat, id)?.formalLabel ?? id;

/**
 * Verify that `components` is a natural transformation F ⇒ G. Returns violations in a stable
 * order (totality, then typing, then naturality); empty means it is genuinely natural.
 */
export function checkNaturalTransformation(
  c: SmallCategory,
  d: CategoryWithComposition,
  f: FunctorMapping,
  g: FunctorMapping,
  components: Record<string, string>,
): NaturalityViolation[] {
  const violations: NaturalityViolation[] = [];

  // 1. Totality + component typing: α_A : F(A) → G(A).
  for (const obj of c.objects) {
    const comp = components[obj.id];
    if (comp === undefined) {
      violations.push({ kind: 'component-total', message: `No component chosen at ${objLabel(c, obj.id)} yet.` });
      continue;
    }
    const m = getMorphism(d, comp);
    const fa = f.objectMap[obj.id];
    const ga = g.objectMap[obj.id];
    if (!m || fa === undefined || ga === undefined) continue;
    if (m.sourceObjectId !== fa || m.targetObjectId !== ga) {
      violations.push({
        kind: 'component-typing',
        message:
          `The component at ${objLabel(c, obj.id)} must go ${objLabel(d, fa)} → ${objLabel(d, ga)}, ` +
          `but ${morLabel(d, comp)} does not.`,
      });
    }
  }

  // 2. Naturality: for each f : A → B, α_B ∘ F(f) = G(f) ∘ α_A.
  for (const mor of c.morphisms) {
    const aA = components[mor.sourceObjectId];
    const aB = components[mor.targetObjectId];
    const ff = f.morphismMap[mor.id];
    const gf = g.morphismMap[mor.id];
    if (aA === undefined || aB === undefined || ff === undefined || gf === undefined) continue;

    const acrossThenDown = composeIn(d.composites, ff, aB); // α_B ∘ F(f)
    const downThenAcross = composeIn(d.composites, aA, gf); // G(f) ∘ α_A
    if (acrossThenDown === undefined || downThenAcross === undefined || acrossThenDown !== downThenAcross) {
      violations.push({
        kind: 'naturality',
        message:
          `The naturality square for ${morLabel(c, mor.id)} does not commute: ` +
          `mapping with F then applying the component gives a different result than ` +
          `applying the component then mapping with G.`,
      });
    }
  }

  return violations;
}

export function isNaturalTransformation(
  c: SmallCategory,
  d: CategoryWithComposition,
  f: FunctorMapping,
  g: FunctorMapping,
  components: Record<string, string>,
): boolean {
  return checkNaturalTransformation(c, d, f, g, components).length === 0;
}
