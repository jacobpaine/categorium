/**
 * Puzzle validation rule types. Pure data + types — no React, no theme strings used for logic.
 */

/** The category-theory concepts a puzzle can exercise / unlock. */
export type ConceptTag =
  | 'object'
  | 'morphism'
  | 'typed-transform'
  | 'composition'
  | 'identity'
  | 'commutative-diagram';

export const CONCEPT_TAGS: readonly ConceptTag[] = [
  'object',
  'morphism',
  'typed-transform',
  'composition',
  'identity',
  'commutative-diagram',
];

/**
 * A single constraint a solution must satisfy. Rules are evaluated in order; the FIRST
 * failing rule is surfaced to the player. Multiple valid solutions are allowed — rules
 * describe constraints, not one canonical answer.
 */
export type PuzzleValidationRule =
  /** Every wire must connect type-compatible ports (no machine-to-wrong-thing). */
  | { type: 'type-valid-wiring' }
  | { type: 'required-final-object'; objectId: string }
  | { type: 'allowed-morphisms-only'; morphismIds: string[] }
  | { type: 'path-equivalence'; leftPathId: string; rightPathId: string }
  | { type: 'concept-tag-required'; conceptTag: ConceptTag };

export type PuzzleValidationRuleType = PuzzleValidationRule['type'];
