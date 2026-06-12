/**
 * Natural-transformation puzzle schema. Carries two categories C and D (D with a composition
 * table), two functors F, G : C → D, and the reference components the player must reproduce.
 */
import { z } from 'zod';
import { themeTextSchema, conceptTagSchema, formalRevealSchema } from './common';
import { smallCategorySchema, functorMappingSchema } from './functor.schema';

export const compositionEntrySchema = z.object({
  first: z.string().min(1),
  second: z.string().min(1),
  result: z.string().min(1),
});

/** Target category D + the slice of its composition table needed to check naturality. */
export const categoryWithCompositionSchema = smallCategorySchema.extend({
  composites: z.array(compositionEntrySchema),
});

export const naturalTransformationPuzzleSchema = z.object({
  status: z.literal('authored'),
  kind: z.literal('natural-transformation'),
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: themeTextSchema,
  conceptTags: z.array(conceptTagSchema),
  intro: themeTextSchema,
  goal: themeTextSchema,
  sourceCategory: smallCategorySchema,
  targetCategory: categoryWithCompositionSchema,
  functorF: functorMappingSchema,
  functorG: functorMappingSchema,
  /** C-objectId → D-morphismId (the component α_A at each object). */
  referenceComponents: z.record(z.string(), z.string()),
  reveal: formalRevealSchema,
  glossaryUnlocks: z.array(z.string().min(1)),
});

export type CategoryWithCompositionData = z.infer<typeof categoryWithCompositionSchema>;
export type NaturalTransformationPuzzle = z.infer<typeof naturalTransformationPuzzleSchema>;
