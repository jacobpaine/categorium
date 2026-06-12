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
  referenceDiagramSchema,
  validationRuleSchema,
  sampleValueSchema,
  formalRevealSchema,
} from './common';
import {
  naturalTransformationPuzzleSchema,
  type NaturalTransformationPuzzle,
} from './naturalTransformation.schema';

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
  /** Distinguishes ordinary transformation puzzles from functor puzzles. */
  kind: z.literal('transformation').default('transformation'),
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
  /** Optional read-only context diagram (e.g. the plain pipeline a lifting puzzle transports). */
  referenceDiagram: referenceDiagramSchema.optional(),
  /** Heading for the reference diagram panel. */
  referenceLabel: themeTextSchema.optional(),
});

// Plain union (not discriminated): all authored kinds share status 'authored' but differ on
// `kind`, and each carries a distinct body, so the variants never overlap.
export const puzzleSchema = z.union([
  puzzleAuthoredSchema,
  naturalTransformationPuzzleSchema,
  puzzleStubSchema,
]);

export type AuthoredPuzzle = z.infer<typeof puzzleAuthoredSchema>;
export type PuzzleStub = z.infer<typeof puzzleStubSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;
export type { NaturalTransformationPuzzle };

/** Parse a puzzle, THROWING on failure (loud, for dev / build-time fixtures). */
export function parsePuzzle(input: unknown): Puzzle {
  return puzzleSchema.parse(input);
}

/** Parse without throwing — used to drop broken puzzles from the chapter map. */
export function safeParsePuzzle(input: unknown): z.SafeParseReturnType<unknown, Puzzle> {
  return puzzleSchema.safeParse(input);
}

/** A standard transformation puzzle (the wiring puzzles of Chapters 1–3, 5). */
export function isAuthored(p: Puzzle): p is AuthoredPuzzle {
  return p.status === 'authored' && (p as { kind?: string }).kind !== 'functor';
}

/** A natural-transformation puzzle (Chapter 6): two functors + components to build. */
export function isNaturalTransformationPuzzle(p: Puzzle): p is NaturalTransformationPuzzle {
  return p.status === 'authored' && (p as { kind?: string }).kind === 'natural-transformation';
}

/** Any puzzle the player can actually open and solve. */
export function isPlayable(p: Puzzle): p is AuthoredPuzzle | NaturalTransformationPuzzle {
  return isAuthored(p) || isNaturalTransformationPuzzle(p);
}
