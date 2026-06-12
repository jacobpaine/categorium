/**
 * Natural-transformation validation — wraps the pure `checkNaturalTransformation` into a
 * Run/Check result shape mirroring `validateFunctor`.
 */
import type {
  SmallCategory,
  CategoryWithComposition,
  FunctorMapping,
  NaturalityViolation,
} from '../domain';
import { checkNaturalTransformation } from '../domain';

export type NaturalTransformationValidationResult =
  | { ok: true; violations: [] }
  | {
      ok: false;
      firstFailure: { message: string; nearConcept: 'natural-transformation' };
      violations: NaturalityViolation[];
    };

export function validateNaturalTransformation(
  c: SmallCategory,
  d: CategoryWithComposition,
  f: FunctorMapping,
  g: FunctorMapping,
  components: Record<string, string>,
): NaturalTransformationValidationResult {
  const violations = checkNaturalTransformation(c, d, f, g, components);
  if (violations.length === 0) return { ok: true, violations: [] };
  return {
    ok: false,
    firstFailure: { message: violations[0].message, nearConcept: 'natural-transformation' },
    violations,
  };
}
