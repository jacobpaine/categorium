/**
 * Path equivalence (commutative-diagram checking).
 *
 * IMPORTANT: the app does NOT infer deep categorical equality automatically. Two paths are
 * treated as equivalent when:
 *   1. (Necessary, checked here) both paths compose and share the same source and target
 *      object — they are "parallel" arrows; and
 *   2. (Authoritative) the puzzle author has DECLARED them equivalent via a `path-equivalence`
 *      validation rule / PathEquivalence.
 *
 * Optionally, declared sample values can be run through both paths to corroborate the claim,
 * but absence of an evaluator is fine for the MVP — see `samplesAgree` below.
 */
import type { Diagram, Path, Result } from './types';
import { composePath } from './compose';

export type ParallelCheck = {
  /** Both paths compose and share endpoints. */
  parallel: boolean;
  sourceObjectId?: string;
  targetObjectId?: string;
};

/**
 * Check the necessary structural condition for equivalence: both paths compose successfully
 * and share the same source and target object.
 */
export function checkParallel(diagram: Diagram, left: Path, right: Path): Result<ParallelCheck> {
  const l = composePath(diagram, left);
  if (!l.ok) return { ok: false, error: `Left path does not compose: ${l.error}` };
  const r = composePath(diagram, right);
  if (!r.ok) return { ok: false, error: `Right path does not compose: ${r.error}` };

  const sameSource = l.value.sourceObjectId === r.value.sourceObjectId;
  const sameTarget = l.value.targetObjectId === r.value.targetObjectId;
  const parallel = sameSource && sameTarget;

  if (!parallel) {
    return {
      ok: false,
      error:
        `Paths are not parallel: left is ${l.value.sourceObjectId} -> ${l.value.targetObjectId}, ` +
        `right is ${r.value.sourceObjectId} -> ${r.value.targetObjectId}`,
    };
  }
  return {
    ok: true,
    value: {
      parallel,
      sourceObjectId: l.value.sourceObjectId,
      targetObjectId: l.value.targetObjectId,
    },
  };
}

/**
 * Determine whether two paths can be considered equivalent. `declaredEquivalent` carries the
 * puzzle author's assertion (condition 2 above). This function only confirms the necessary
 * structural condition and combines it with the declaration; it never claims to have *proven*
 * categorical equality.
 */
export function arePathsEquivalent(
  diagram: Diagram,
  left: Path,
  right: Path,
  declaredEquivalent: boolean,
): boolean {
  if (!declaredEquivalent) return false;
  return checkParallel(diagram, left, right).ok;
}

/**
 * Placeholder for optional sample-based corroboration. With no value evaluator in the MVP we
 * cannot run real values through morphisms, so this returns `undefined` ("not checked").
 * A future evaluator would map each morphism's effect on sample values and compare outputs.
 */
export function samplesAgree(): boolean | undefined {
  return undefined;
}
