/**
 * Shared Zod building blocks mirroring the domain & validation types. The Zod schemas are the
 * runtime source of truth for hand-authored JSON; the domain TS types are structurally
 * compatible so parsed data flows straight into the pure engine.
 */
import { z } from 'zod';
import { THEME_IDS } from '../domain';
import type { ThemeId } from '../domain';
import { CONCEPT_TAGS } from '../validation';
import type { ConceptTag } from '../validation';

export const themeIdSchema = z.enum(
  THEME_IDS as unknown as [ThemeId, ...ThemeId[]],
);

/** Every theme key must be present, so no display label is ever missing. */
export const themeTextSchema = z.object({
  data: z.string(),
  alchemy: z.string(),
  spellcraft: z.string(),
  abstract: z.string(),
});

export const conceptTagSchema = z.enum(
  CONCEPT_TAGS as unknown as [ConceptTag, ...ConceptTag[]],
);

export const categoryObjectSchema = z.object({
  id: z.string().min(1),
  formalLabel: z.string().optional(),
  labels: themeTextSchema,
  description: themeTextSchema.optional(),
  icon: z.string().optional(),
  colorToken: z.string().optional(),
});

export const sampleExampleSchema = z.object({
  input: themeTextSchema,
  output: themeTextSchema,
});

export const morphismSchema = z.object({
  id: z.string().min(1),
  formalLabel: z.string().optional(),
  sourceObjectId: z.string().min(1),
  targetObjectId: z.string().min(1),
  labels: themeTextSchema,
  description: themeTextSchema.optional(),
  examples: z.array(sampleExampleSchema).optional(),
});

export const pathSchema = z.object({
  id: z.string().min(1),
  morphismIds: z.array(z.string().min(1)),
});

export const pathEquivalenceSchema = z.object({
  id: z.string().min(1),
  leftPathId: z.string().min(1),
  rightPathId: z.string().min(1),
});

export const sampleValueSchema = z.object({
  id: z.string().min(1),
  objectId: z.string().min(1),
  labels: themeTextSchema,
});

export const graphNodeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('object'),
    nodeId: z.string().min(1),
    objectId: z.string().min(1),
    role: z.enum(['start', 'goal']).optional(),
  }),
  z.object({
    kind: z.literal('morphism'),
    nodeId: z.string().min(1),
    morphismId: z.string().min(1),
  }),
]);

export const graphEdgeSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
});

export const puzzleGraphSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export const validationRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('required-final-object'), objectId: z.string().min(1) }),
  z.object({ type: z.literal('allowed-morphisms-only'), morphismIds: z.array(z.string().min(1)) }),
  z.object({
    type: z.literal('path-equivalence'),
    leftPathId: z.string().min(1),
    rightPathId: z.string().min(1),
  }),
  z.object({ type: z.literal('concept-tag-required'), conceptTag: conceptTagSchema }),
]);

export const formalRevealSchema = z.object({
  /** Theme-language explanation shown right after success. */
  afterSuccess: themeTextSchema,
  /** Short, mostly notation-free formal reveal. */
  summary: z.string(),
  /** Formal notation lines, e.g. ["A --f--> B", "f: A → B"]. */
  notation: z.array(z.string()).optional(),
  /** Expandable deeper explanation ("more formal"). */
  moreFormal: z.string().optional(),
  /** Opt-in programmer analogy. */
  programmerAnalogy: z.string().optional(),
});
