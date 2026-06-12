import { describe, it, expect } from 'vitest';
import { PUZZLES } from '../data';
import { isChapterUnlocked, chapterPuzzles } from './chapters';

describe('chapter unlocking', () => {
  it('chapter 1 is always unlocked', () => {
    expect(isChapterUnlocked('chapter-01-transformations', new Set(), PUZZLES)).toBe(true);
  });

  it('chapter 2 unlocks only after every chapter 1 puzzle is complete', () => {
    const ch1 = chapterPuzzles('chapter-01-transformations', PUZZLES).map((p) => p.id);
    expect(ch1.length).toBeGreaterThan(0);
    expect(isChapterUnlocked('chapter-02-laws', new Set(), PUZZLES)).toBe(false);
    // One short of finishing Chapter 1.
    expect(isChapterUnlocked('chapter-02-laws', new Set(ch1.slice(0, -1)), PUZZLES)).toBe(false);
    // All of Chapter 1 done.
    expect(isChapterUnlocked('chapter-02-laws', new Set(ch1), PUZZLES)).toBe(true);
  });

  it('an unknown / not-yet-added chapter never unlocks', () => {
    const allDone = new Set(PUZZLES.map((p) => p.id));
    expect(isChapterUnlocked('chapter-99-nonexistent', allDone, PUZZLES)).toBe(false);
  });
});
