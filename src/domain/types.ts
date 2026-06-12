/**
 * Formal category-theory domain model. This layer is PURE — no React, no theme strings used
 * for logic. Theme display labels live on the objects/morphisms only as presentation data;
 * nothing here branches on them.
 *
 * Mapping to game/UI vocabulary (kept out of this layer):
 *   CategoryObject -> "type" / start & goal terminals
 *   Morphism       -> "machine"
 *   Path           -> a chain of machines (wires in sequence)
 *   Composition    -> the single transformation a whole chain represents
 */

/** The four swappable presentation skins. Logic never branches on this. */
export type ThemeId = 'data' | 'alchemy' | 'spellcraft' | 'abstract';

export const THEME_IDS: readonly ThemeId[] = ['data', 'alchemy', 'spellcraft', 'abstract'];

/** A localized-by-theme string bundle (one entry per ThemeId). */
export type ThemeText = Record<ThemeId, string>;

/** An object/type in the category — a "thing" that can be transformed. */
export type CategoryObject = {
  /** Stable internal id (used for all logic). */
  id: string;
  /** Formal label such as 'A', 'B', 'C'. Auto-generated if absent. */
  formalLabel?: string;
  /** Theme display names. */
  labels: ThemeText;
  description?: ThemeText;
  icon?: string;
  colorToken?: string;
};

/** A concrete sample value of some object, used for metaphor-mode animation/examples. */
export type SampleValue = {
  id: string;
  objectId: string;
  labels: ThemeText;
};

/** An author-provided example of what a morphism does to a sample, for teaching text. */
export type SampleExample = {
  /** Display label of the input sample (theme text). */
  input: ThemeText;
  /** Display label of the output sample (theme text). */
  output: ThemeText;
};

/**
 * A morphism (a "machine"). MVP morphisms are UNARY: exactly one source object and one
 * target object.
 *
 * EXTENSION POINT: products / sums / multi-input morphisms would generalize source/target to
 * lists (e.g. `sourceObjectIds: string[]`). Keep new code reading these through the helpers
 * in `compose.ts` so that generalization stays localized.
 */
export type Morphism = {
  id: string;
  /** Formal label such as 'f', 'g', 'h'. Auto-generated if absent. */
  formalLabel?: string;
  sourceObjectId: string;
  targetObjectId: string;
  labels: ThemeText;
  description?: ThemeText;
  examples?: SampleExample[];
  /**
   * The machine's BEHAVIOR: a declared table from an input sample-value id to the output
   * sample-value id it produces. A missing entry means the machine jams on that input (it can't
   * process it). This is what the value runtime (`evaluate.ts`) executes.
   */
  action?: Record<string, string>;
};

/** A composable sequence of morphisms, referenced by id. */
export type Path = {
  id: string;
  morphismIds: string[];
};

/** The result of composing a Path into a single arrow source -> target. */
export type Composition = {
  /** Source object of the first morphism in the path. */
  sourceObjectId: string;
  /** Target object of the last morphism in the path. */
  targetObjectId: string;
  /** The morphisms composed, in application order (do the first one first). */
  morphismIds: string[];
};

/** An author's assertion that two paths are equivalent (a commutative-diagram edge). */
export type PathEquivalence = {
  id: string;
  leftPathId: string;
  rightPathId: string;
};

/** A category fragment: the objects, morphisms, and any declared paths/equivalences. */
export type Diagram = {
  objects: CategoryObject[];
  morphisms: Morphism[];
  paths?: Path[];
  equivalences?: PathEquivalence[];
};

/** Simple Result type so pure functions can report failures without throwing. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
