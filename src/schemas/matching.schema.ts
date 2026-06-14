/**
 * Matching puzzle schema — a "bijection-matching" board. The player pairs each item in the left
 * column with the correct item in the right column (drawing one edge per left item). Used for
 * adjunctions (match a function with its transpose) and Yoneda (match by relationships). The right
 * column may carry distractors, so a match is a genuine choice, not a permutation.
 */
import { z } from 'zod';
import { themeTextSchema, conceptTagSchema, formalRevealSchema } from './common';

export const matchItemSchema = z.object({
  id: z.string().min(1),
  label: themeTextSchema,
  /** A smaller second line, e.g. a type signature. */
  sub: themeTextSchema.optional(),
});

export const matchingPuzzleSchema = z.object({
  status: z.literal('authored'),
  kind: z.literal('matching'),
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: themeTextSchema,
  conceptTags: z.array(conceptTagSchema),
  intro: themeTextSchema,
  goal: themeTextSchema,
  /** Optional context panel (e.g. "F ⊣ G, with the bijection Hom(FA,B) ≅ Hom(A,GB)"). */
  context: themeTextSchema.optional(),
  leftLabel: themeTextSchema,
  rightLabel: themeTextSchema,
  left: z.array(matchItemSchema).min(1),
  right: z.array(matchItemSchema).min(1),
  /** leftId → rightId: the correct pairing the player must reproduce. */
  solution: z.record(z.string(), z.string()),
  reveal: formalRevealSchema,
  glossaryUnlocks: z.array(z.string().min(1)),
});

export type MatchItem = z.infer<typeof matchItemSchema>;
export type MatchingPuzzle = z.infer<typeof matchingPuzzleSchema>;
