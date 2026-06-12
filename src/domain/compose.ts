/**
 * Composition of morphisms. Pure category-theory logic.
 *
 * A path [m0, m1, ...] is composable iff target(mi) === source(m(i+1)) for every adjacent
 * pair. The composite reads "do m0 first, then m1, ..."; in standard notation a two-step
 * path [f, g] is written `g ∘ f`. Its source is source(f) and its target is target(g).
 */
import type { Diagram, Morphism, CategoryObject, Path, Composition, Result } from './types';

/** Look up a morphism by id within a diagram. */
export function getMorphism(diagram: Diagram, id: string): Morphism | undefined {
  return diagram.morphisms.find((m) => m.id === id);
}

/** Look up an object by id within a diagram. */
export function getObject(diagram: Diagram, id: string): CategoryObject | undefined {
  return diagram.objects.find((o) => o.id === id);
}

/**
 * The source/target accessors are the single read point for a morphism's endpoints.
 * EXTENSION POINT: if morphisms gain multiple inputs/outputs, generalize here.
 */
export function sourceOf(m: Morphism): string {
  return m.sourceObjectId;
}

export function targetOf(m: Morphism): string {
  return m.targetObjectId;
}

/**
 * Check whether a sequence of morphism ids forms a composable chain in the diagram.
 * Returns the resolved morphisms in order, or an error describing the first break.
 */
export function resolveChain(diagram: Diagram, morphismIds: string[]): Result<Morphism[]> {
  const resolved: Morphism[] = [];
  for (const id of morphismIds) {
    const m = getMorphism(diagram, id);
    if (!m) return { ok: false, error: `Unknown morphism '${id}'` };
    resolved.push(m);
  }
  for (let i = 0; i < resolved.length - 1; i++) {
    const a = resolved[i];
    const b = resolved[i + 1];
    if (targetOf(a) !== sourceOf(b)) {
      return {
        ok: false,
        error:
          `Cannot compose '${a.id}' then '${b.id}': ` +
          `target of '${a.id}' is '${targetOf(a)}' but source of '${b.id}' is '${sourceOf(b)}'`,
      };
    }
  }
  return { ok: true, value: resolved };
}

/** True iff the morphism ids form a composable chain (empty chains are not composable). */
export function isComposable(diagram: Diagram, morphismIds: string[]): boolean {
  if (morphismIds.length === 0) return false;
  return resolveChain(diagram, morphismIds).ok;
}

/** Compose a list of morphism ids into a single Composition (source -> target). */
export function composeMorphisms(diagram: Diagram, morphismIds: string[]): Result<Composition> {
  if (morphismIds.length === 0) {
    return { ok: false, error: 'Cannot compose an empty chain' };
  }
  const chain = resolveChain(diagram, morphismIds);
  if (!chain.ok) return chain;
  const first = chain.value[0];
  const last = chain.value[chain.value.length - 1];
  return {
    ok: true,
    value: {
      sourceObjectId: sourceOf(first),
      targetObjectId: targetOf(last),
      morphismIds: [...morphismIds],
    },
  };
}

/** Compose a declared Path into a Composition. */
export function composePath(diagram: Diagram, path: Path): Result<Composition> {
  return composeMorphisms(diagram, path.morphismIds);
}
