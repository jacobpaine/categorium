/**
 * Quiz schema. The quiz is a study aid that associates each theme's vocabulary with the formal
 * category-theory idea it stands for: two questions per glossary term, each with a theme-aware
 * prompt (the wording changes with the selected theme) and a fixed set of options. Options are
 * plain strings (concept names or statements); the theme flavour lives in the prompt.
 */
import { z } from 'zod';
import { themeTextSchema } from './common';

export const quizOptionSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
});

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  /** The glossary entry id this question tests. */
  termId: z.string().min(1),
  prompt: themeTextSchema,
  options: z.array(quizOptionSchema).min(2),
  explanation: themeTextSchema,
});

export const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/** Parse the quiz, THROWING on failure (build-time content bug, like themes/glossary). */
export function parseQuiz(input: unknown): QuizQuestion[] {
  return quizSchema.parse(input).questions;
}
