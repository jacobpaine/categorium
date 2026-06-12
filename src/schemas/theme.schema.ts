/**
 * Theme schema + parser. Themes are presentation only — they carry no logic.
 */
import { z } from 'zod';
import { themeIdSchema } from './common';

export const themeSchema = z.object({
  id: themeIdSchema,
  name: z.string(),
  /** Short card description. */
  tagline: z.string(),
  /** e.g. "programmers" — surfaced as "recommended for ...". */
  recommendedFor: z.string().optional(),
  /** Marks the Abstract Machine World "pure mode" card. */
  pure: z.boolean().optional(),
  /** A one-line example mapping for the theme card: from --machine--> to. */
  example: z.object({
    from: z.string(),
    machine: z.string(),
    to: z.string(),
  }),
});

export const themesFileSchema = z.array(themeSchema).length(4);

export type Theme = z.infer<typeof themeSchema>;

export function parseThemes(input: unknown): Theme[] {
  return themesFileSchema.parse(input);
}
