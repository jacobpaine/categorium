/**
 * Tour ("Chapter 0") schema. The interactive introduction is a short sequence of guided steps,
 * each of which is a real, playable game board — so it reuses the entire puzzle machinery
 * (diagram, behavior runtime, validation, canvas) rather than inventing a parallel format.
 *
 * A step IS an authored puzzle (`puzzleAuthoredSchema`); the guided chrome (step counter,
 * instruction banner, "what you learned" + Next) is supplied by `TourScreen`, which reuses the
 * puzzle's own `intro` as the instruction and `reveal` as the teaching moment.
 */
import { z } from 'zod';
import { puzzleAuthoredSchema, type AuthoredPuzzle } from './puzzle.schema';

export const tourSchema = z.object({
  steps: z.array(puzzleAuthoredSchema).min(1),
});

export type Tour = { steps: AuthoredPuzzle[] };

/** Parse the tour, THROWING on failure (build-time content bug, like themes/glossary). */
export function parseTour(input: unknown): AuthoredPuzzle[] {
  return tourSchema.parse(input).steps;
}
