import { describe, it, expect } from 'vitest';
import { safeParsePuzzle, parsePuzzle } from './puzzle.schema';
import { parseThemes } from './theme.schema';
import { parseGlossary } from './glossary.schema';
import { PUZZLES } from '../data';

import puzzle01 from '../data/puzzles/puzzle-01.json';
import themesJson from '../data/themes.json';
import glossaryJson from '../data/glossary.json';

describe('puzzle schema', () => {
  it('parses the authored Puzzle 1', () => {
    const p = parsePuzzle(puzzle01);
    expect(p.id).toBe('puzzle-01');
    expect(p.status).toBe('authored');
  });

  it('all five bundled puzzles pass validation and load', () => {
    // src/data/index.ts drops invalid puzzles, so a full set means all parsed.
    expect(PUZZLES.map((p) => p.id)).toEqual([
      'puzzle-01',
      'puzzle-02',
      'puzzle-03',
      'puzzle-04',
      'puzzle-05',
    ]);
  });

  it('rejects a malformed puzzle with a useful path', () => {
    const broken = {
      ...(puzzle01 as Record<string, unknown>),
      objects: [{ id: 'obj-a' /* missing required `labels` */ }],
    };
    const result = safeParsePuzzle(broken);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths.some((p) => p.startsWith('objects'))).toBe(true);
    }
  });

  it('requires all four theme keys in theme text', () => {
    const missingTheme = {
      ...(puzzle01 as Record<string, unknown>),
      title: { data: 'x', alchemy: 'x', spellcraft: 'x' /* abstract missing */ },
    };
    expect(safeParsePuzzle(missingTheme).success).toBe(false);
  });
});

describe('theme & glossary schemas', () => {
  it('parses all four themes', () => {
    expect(parseThemes(themesJson)).toHaveLength(4);
  });

  it('parses the glossary entries', () => {
    const g = parseGlossary(glossaryJson);
    expect(g.map((e) => e.id)).toContain('morphism');
  });
});
