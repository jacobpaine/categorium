import { describe, it, expect } from 'vitest';
import { PUZZLES } from '../data';
import { isMatchingPuzzle } from '../schemas';
import { validateMatching } from './validateMatching';

const matchingPuzzles = PUZZLES.filter(isMatchingPuzzle);

describe('matching puzzles — reference solutions pass; wrong/incomplete pairings fail', () => {
  it('there are matching puzzles to check', () => {
    expect(matchingPuzzles.length).toBeGreaterThan(0);
  });

  for (const p of matchingPuzzles) {
    describe(p.id, () => {
      it('the reference solution validates', () => {
        expect(validateMatching(p.solution, p.solution).ok).toBe(true);
      });

      it('every left item has a valid right target in the solution', () => {
        const rightIds = new Set(p.right.map((r) => r.id));
        for (const leftId of Object.keys(p.solution)) {
          expect(rightIds.has(p.solution[leftId]), `${leftId} -> ${p.solution[leftId]}`).toBe(true);
        }
        // every left item is part of the solution
        for (const l of p.left) expect(p.solution[l.id], `${l.id} unmatched`).toBeDefined();
      });

      it('an incomplete pairing is rejected', () => {
        expect(validateMatching(p.solution, {}).ok).toBe(false);
      });

      it('matching a left item to the distractor (a wrong right) is rejected', () => {
        const leftIds = Object.keys(p.solution);
        const wrongRight = p.right.find((r) => !new Set(Object.values(p.solution)).has(r.id));
        if (wrongRight) {
          const bad = { ...p.solution, [leftIds[0]]: wrongRight.id };
          expect(validateMatching(p.solution, bad).ok).toBe(false);
        }
      });
    });
  }
});
