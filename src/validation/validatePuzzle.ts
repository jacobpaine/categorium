/**
 * Puzzle validation engine. Pure — takes a diagram + rules + the player's constructed graph
 * and returns whether the solution is valid, reporting the first failing rule.
 *
 * UI concern (not here): wrap `message` in theme language and, if unlocked, show the formal
 * explanation. This layer stays theme-neutral and React-free.
 */
import type { Diagram, Path } from '../domain';
import { tracePath, morphismIdsUsed, getObject, arePathsEquivalent, runChain } from '../domain';
import type { PuzzleGraph } from '../domain';
import type { ConceptTag, PuzzleValidationRule } from './rules';
import { conceptsExercised } from './concepts';
import { wireTypeErrors } from './wiring';

/** Minimal puzzle slice the engine needs — schemas/UI pass a superset. */
export type ValidationInput = {
  diagram: Diagram;
  rules: PuzzleValidationRule[];
};

export type RuleFailure = {
  rule: PuzzleValidationRule;
  /** Theme-neutral explanation of the first failing rule. */
  message: string;
  /** The concept the player is closest to using, to guide a gentle hint. */
  nearConcept?: ConceptTag;
};

export type ValidationResult =
  | { ok: true; failures: [] }
  | { ok: false; firstFailure: RuleFailure; failures: RuleFailure[] };

function findPath(diagram: Diagram, pathId: string): Path | undefined {
  return diagram.paths?.find((p) => p.id === pathId);
}

function evaluateRule(
  rule: PuzzleValidationRule,
  diagram: Diagram,
  graph: PuzzleGraph,
): RuleFailure | null {
  switch (rule.type) {
    case 'type-valid-wiring': {
      const errors = wireTypeErrors(diagram, graph);
      if (errors.length > 0) {
        return { rule, message: errors[0].message, nearConcept: 'typed-transform' };
      }
      return null;
    }

    case 'required-output': {
      const traced = tracePath(diagram, graph);
      if (!traced.ok) {
        return {
          rule,
          message: `The solution does not form a complete path: ${traced.error}`,
          nearConcept: 'composition',
        };
      }
      const run = runChain(diagram, traced.value.morphismIds, rule.inputValueId);
      if (!run.ok) {
        return { rule, message: run.error, nearConcept: 'typed-transform' };
      }
      if (run.value !== rule.outputValueId) {
        return {
          rule,
          message: 'Your machines ran, but the result isn’t the goal. Look at what each machine actually does.',
          nearConcept: 'morphism',
        };
      }
      return null;
    }

    case 'required-final-object': {
      const traced = tracePath(diagram, graph);
      if (!traced.ok) {
        return {
          rule,
          message: `The solution does not form a complete path: ${traced.error}`,
          nearConcept: 'composition',
        };
      }
      if (traced.value.finalObjectId !== rule.objectId) {
        const want = getObject(diagram, rule.objectId);
        return {
          rule,
          message:
            `The path must end at '${want?.formalLabel ?? rule.objectId}', ` +
            `but it currently ends at '${traced.value.finalObjectId}'.`,
          nearConcept: 'morphism',
        };
      }
      return null;
    }

    case 'allowed-morphisms-only': {
      const allowed = new Set(rule.morphismIds);
      const used = morphismIdsUsed(graph);
      const offending = used.find((id) => !allowed.has(id));
      if (offending !== undefined) {
        return {
          rule,
          message: `Machine '${offending}' is not allowed in this puzzle.`,
          nearConcept: 'typed-transform',
        };
      }
      return null;
    }

    case 'path-equivalence': {
      const left = findPath(diagram, rule.leftPathId);
      const right = findPath(diagram, rule.rightPathId);
      if (!left || !right) {
        return {
          rule,
          message: `Path-equivalence rule references an unknown path.`,
          nearConcept: 'commutative-diagram',
        };
      }
      // The rule's presence is the author's declaration of equivalence; we confirm the
      // necessary structural condition (parallel, composable endpoints).
      if (!arePathsEquivalent(diagram, left, right, true)) {
        return {
          rule,
          message: `The two paths do not share the same start and end, so they cannot be equivalent.`,
          nearConcept: 'commutative-diagram',
        };
      }
      return null;
    }

    case 'concept-tag-required': {
      const exercised = conceptsExercised(diagram, graph);
      if (!exercised.has(rule.conceptTag)) {
        return {
          rule,
          message: `This solution does not yet use the required idea: ${rule.conceptTag}.`,
          nearConcept: rule.conceptTag,
        };
      }
      return null;
    }
  }
}

/** Validate a constructed graph against a puzzle's rules, in declaration order. */
export function validatePuzzle(input: ValidationInput, graph: PuzzleGraph): ValidationResult {
  const failures: RuleFailure[] = [];
  for (const rule of input.rules) {
    const failure = evaluateRule(rule, input.diagram, graph);
    if (failure) failures.push(failure);
  }
  if (failures.length === 0) return { ok: true, failures: [] };
  return { ok: false, firstFailure: failures[0], failures };
}
