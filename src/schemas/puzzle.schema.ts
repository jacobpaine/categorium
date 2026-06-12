/**
 * Puzzle schema + loud parser. A puzzle is either fully `authored` or a `stub` (id, chapter,
 * order, concept tags, and brief text only — enough to list on the chapter map as a preview).
 */
import { z } from 'zod';
import {
  themeTextSchema,
  conceptTagSchema,
  categoryObjectSchema,
  morphismSchema,
  pathSchema,
  pathEquivalenceSchema,
  puzzleGraphSchema,
  validationRuleSchema,
  sampleValueSchema,
  formalRevealSchema,
} from './common';

export const puzzleStubSchema = z.object({
  status: z.literal('stub'),
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: themeTextSchema,
  conceptTags: z.array(conceptTagSchema),
  intro: themeTextSchema,
  goal: themeTextSchema,
});

export const puzzleAuthoredSchema = z.object({
  status: z.literal('authored'),
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: themeTextSchema,
  conceptTags: z.array(conceptTagSchema),
  intro: themeTextSchema,
  goal: themeTextSchema,
  objects: z.array(categoryObjectSchema).min(1),
  morphisms: z.array(morphismSchema),
  paths: z.array(pathSchema).optional(),
  equivalences: z.array(pathEquivalenceSchema).optional(),
  initialGraph: puzzleGraphSchema,
  allowedMorphismIds: z.array(z.string().min(1)),
  validation: z.array(validationRuleSchema).min(1),
  samples: z.array(sampleValueSchema).optional(),
  reveal: formalRevealSchema,
  glossaryUnlocks: z.array(z.string().min(1)),
  referenceSolution: puzzleGraphSchema.optional(),
});

export const puzzleSchema = z.discriminatedUnion('status', [
  puzzleAuthoredSchema,
  puzzleStubSchema,
]);

export type AuthoredPuzzle = z.infer<typeof puzzleAuthoredSchema>;
export type PuzzleStub = z.infer<typeof puzzleStubSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;

/** Parse a puzzle, THROWING on failure (loud, for dev / build-time fixtures). */
export function parsePuzzle(input: unknown): Puzzle {
  return puzzleSchema.parse(input);
}

/** Parse without throwing — used to drop broken puzzles from the chapter map. */
export function safeParsePuzzle(input: unknown): z.SafeParseReturnType<unknown, Puzzle> {
  return puzzleSchema.safeParse(input);
}

/** Narrowing helper. */
export function isAuthored(p: Puzzle): p is AuthoredPuzzle {
  return p.status === 'authored';
}
