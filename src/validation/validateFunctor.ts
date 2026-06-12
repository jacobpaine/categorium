/**
 * Functor validation — wraps the pure `checkFunctor` into a Run/Check result shape mirroring
 * `validatePuzzle`, so the UI can treat functor puzzles uniformly.
 */
import type { SmallCategory, FunctorMapping, FunctorViolation } from '../domain';
import { checkFunctor } from '../domain';

export type FunctorValidationResult =
  | { ok: true; violations: [] }
  | {
      ok: false;
      firstFailure: { message: string; nearConcept: 'functor' };
      violations: FunctorViolation[];
    };

export function validateFunctor(
  source: SmallCategory,
  target: SmallCategory,
  mapping: FunctorMapping,
): FunctorValidationResult {
  const violations = checkFunctor(source, target, mapping);
  if (violations.length === 0) return { ok: true, violations: [] };
  return {
    ok: false,
    firstFailure: { message: violations[0].message, nearConcept: 'functor' },
    violations,
  };
}
