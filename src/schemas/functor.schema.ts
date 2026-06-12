/**
 * Small-category + functor-mapping schemas. Retained for Chapter 6 (natural transformations),
 * which uses two functors `F, G : C → D`. (The standalone functor *puzzle kind* was retired in
 * favour of the behaviour-based "lifting" puzzles — see Chapter 4.)
 */
import { z } from 'zod';
import { categoryObjectSchema, morphismSchema } from './common';

/** A small category — objects + morphisms. */
export const smallCategorySchema = z.object({
  objects: z.array(categoryObjectSchema).min(1),
  morphisms: z.array(morphismSchema),
});

export const functorMappingSchema = z.object({
  objectMap: z.record(z.string(), z.string()),
  morphismMap: z.record(z.string(), z.string()),
});

export type SmallCategoryData = z.infer<typeof smallCategorySchema>;
