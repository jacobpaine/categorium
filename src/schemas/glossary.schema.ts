/**
 * Glossary schema + parser. Entries unlock as concepts are encountered.
 */
import { z } from 'zod';
import { themeTextSchema, conceptTagSchema } from './common';

export const glossaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string(),
  unlockedByConcept: conceptTagSchema,
  /** One-line definition, mostly theme-neutral. */
  shortDefinition: z.string(),
  /** Theme-language explanation first. */
  themeExplanation: themeTextSchema,
  /** Formal definition second. */
  formalDefinition: z.string().optional(),
  programmerAnalogy: z.string().optional(),
  notationExamples: z.array(z.string()).optional(),
});

export const glossaryFileSchema = z.array(glossaryEntrySchema);

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

export function parseGlossary(input: unknown): GlossaryEntry[] {
  return glossaryFileSchema.parse(input);
}
