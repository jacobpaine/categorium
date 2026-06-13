/**
 * Loads and validates all bundled content. Puzzles that fail schema validation are dropped
 * from the player-facing list (and logged loudly in dev) so a broken puzzle never reaches the
 * chapter map. Themes and glossary parse strictly — a failure there is a build-time bug.
 */
import { safeParsePuzzle, parseThemes, parseGlossary, parseTour } from '../schemas';
import type { AuthoredPuzzle, Puzzle, Theme, GlossaryEntry } from '../schemas';
import type { Diagram } from '../domain';
import type { ValidationInput } from '../validation';

import themesJson from './themes.json';
import glossaryJson from './glossary.json';
import tourJson from './tour.json';

// Auto-load every puzzle JSON. Adding a chapter is just dropping a file in puzzles/.
const puzzleModules = import.meta.glob<{ default: unknown }>('./puzzles/*.json', { eager: true });

/** Puzzles that failed schema validation, surfaced in the debug panel (empty when all valid). */
export const PUZZLE_LOAD_ERRORS: { id: string; error: string }[] = [];

function loadPuzzles(): Puzzle[] {
  const valid: Puzzle[] = [];
  for (const path of Object.keys(puzzleModules).sort()) {
    const raw = puzzleModules[path].default;
    const result = safeParsePuzzle(raw);
    if (result.success) {
      valid.push(result.data);
    } else {
      const id =
        raw && typeof raw === 'object' && 'id' in raw ? String((raw as { id: unknown }).id) : path;
      PUZZLE_LOAD_ERRORS.push({ id, error: JSON.stringify(result.error.format(), null, 2) });
      // Fail loudly in dev; the chapter map simply omits this puzzle for players.
      console.error(`[categorium] Puzzle '${id}' failed schema validation:`, result.error.format());
    }
  }
  return valid.sort((a, b) => a.order - b.order);
}

export const PUZZLES: Puzzle[] = loadPuzzles();
export const THEMES: Theme[] = parseThemes(themesJson);
export const GLOSSARY: GlossaryEntry[] = parseGlossary(glossaryJson);
/** The interactive introduction ("Chapter 0") — guided, playable definition steps. */
export const TOUR: AuthoredPuzzle[] = parseTour(tourJson);

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY.find((g) => g.id === id);
}

/** The category fragment described by an authored puzzle. */
export function toDiagram(p: AuthoredPuzzle): Diagram {
  return {
    objects: p.objects,
    morphisms: p.morphisms,
    paths: p.paths,
    equivalences: p.equivalences,
  };
}

/** Bridge an authored puzzle into the pure validation engine's input. */
export function toValidationInput(p: AuthoredPuzzle): ValidationInput {
  return { diagram: toDiagram(p), rules: p.validation };
}
