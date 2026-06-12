/**
 * Functor puzzle schema. A functor puzzle carries two small categories (each with a display
 * graph for layout) and the reference object/morphism mapping the player must reproduce.
 */
import { z } from 'zod';
import {
  themeTextSchema,
  conceptTagSchema,
  categoryObjectSchema,
  morphismSchema,
  formalRevealSchema,
} from './common';

/** A small category — objects + morphisms. The functor canvas auto-lays-out the chips. */
export const smallCategorySchema = z.object({
  objects: z.array(categoryObjectSchema).min(1),
  morphisms: z.array(morphismSchema),
});

export const functorMappingSchema = z.object({
  objectMap: z.record(z.string(), z.string()),
  morphismMap: z.record(z.string(), z.string()),
});

export const functorPuzzleSchema = z.object({
  status: z.literal('authored'),
  kind: z.literal('functor'),
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: themeTextSchema,
  conceptTags: z.array(conceptTagSchema),
  intro: themeTextSchema,
  goal: themeTextSchema,
  sourceCategory: smallCategorySchema,
  targetCategory: smallCategorySchema,
  referenceMapping: functorMappingSchema,
  reveal: formalRevealSchema,
  glossaryUnlocks: z.array(z.string().min(1)),
});

export type SmallCategoryData = z.infer<typeof smallCategorySchema>;
export type FunctorPuzzle = z.infer<typeof functorPuzzleSchema>;
