import { describe, it, expect } from 'vitest';
import { PUZZLES, getPuzzle, toValidationInput } from '../data';
import { isAuthored } from '../schemas';
import type { AuthoredPuzzle } from '../schemas';
import type { PuzzleGraph } from '../domain';
import { validatePuzzle } from './validatePuzzle';

const toolkitPuzzles = PUZZLES.filter(
  (p): p is AuthoredPuzzle => isAuthored(p) && p.toolkit !== undefined,
);

/** Every transformation chapter that has been converted to the toolkit board. */
const TOOLKIT_CHAPTERS = [
  'chapter-01-transformations',
  'chapter-02-laws',
  'chapter-03-isomorphisms',
  'chapter-04-functors',
  'chapter-05-products',
  'chapter-07-monads',
  'chapter-08-limits',
];

describe('toolkit puzzles — schema invariants', () => {
  for (const chapterId of TOOLKIT_CHAPTERS) {
    it(`${chapterId} is fully converted to toolkit mode`, () => {
      const chapter = PUZZLES.filter(
        (p): p is AuthoredPuzzle => isAuthored(p) && p.chapterId === chapterId,
      );
      expect(chapter.length).toBeGreaterThan(0);
      expect(chapter.every((p) => p.toolkit !== undefined)).toBe(true);
    });
  }

  for (const p of toolkitPuzzles) {
    describe(p.id, () => {
      const objectIds = new Set(p.objects.map((o) => o.id));
      const morphismIds = new Set(p.morphisms.map((m) => m.id));

      it('palette ids all reference the catalog', () => {
        for (const id of p.toolkit!.paletteObjectIds) expect(objectIds.has(id)).toBe(true);
        for (const id of p.toolkit!.paletteMorphismIds) expect(morphismIds.has(id)).toBe(true);
      });

      it('pins only start/goal objects in initialGraph (no pre-placed morphisms)', () => {
        for (const node of p.initialGraph.nodes) {
          expect(node.kind).toBe('object');
          if (node.kind === 'object') expect(node.role === 'start' || node.role === 'goal').toBe(true);
        }
      });

      it('does not pre-place anything that is also in the tray', () => {
        const placed = new Set(
          p.initialGraph.nodes.flatMap((n) => (n.kind === 'object' ? [n.objectId] : [n.morphismId])),
        );
        for (const id of p.toolkit!.paletteObjectIds) expect(placed.has(id)).toBe(false);
        for (const id of p.toolkit!.paletteMorphismIds) expect(placed.has(id)).toBe(false);
      });
    });
  }
});

/** Build a graph from arbitrary nodes + wires (toolkit pieces are placed by the player). */
function graph(nodes: PuzzleGraph['nodes'], edges: [string, string][]): PuzzleGraph {
  return { nodes, edges: edges.map(([s, t], i) => ({ id: `e${i}`, sourceNodeId: s, targetNodeId: t })) };
}

describe('toolkit puzzle-01 — choosing the wrong tray piece fails', () => {
  const input = () => toValidationInput(getPuzzle('puzzle-01') as never);

  it('placing the faithful Parser and wiring it solves', () => {
    const res = validatePuzzle(
      input(),
      graph(
        [
          { kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' },
          { kind: 'morphism', nodeId: 'tk-morphism-mor-parser-0', morphismId: 'mor-parser' },
          { kind: 'object', nodeId: 'n-b', objectId: 'obj-b', role: 'goal' },
        ],
        [
          ['n-a', 'tk-morphism-mor-parser-0'],
          ['tk-morphism-mor-parser-0', 'n-b'],
        ],
      ),
    );
    expect(res.ok).toBe(true);
  });

  it('placing the Shredder distractor instead produces the wrong value (required-output)', () => {
    const res = validatePuzzle(
      input(),
      graph(
        [
          { kind: 'object', nodeId: 'n-a', objectId: 'obj-a', role: 'start' },
          { kind: 'morphism', nodeId: 'tk-morphism-mor-shred-0', morphismId: 'mor-shred' },
          { kind: 'object', nodeId: 'n-b', objectId: 'obj-b', role: 'goal' },
        ],
        [
          ['n-a', 'tk-morphism-mor-shred-0'],
          ['tk-morphism-mor-shred-0', 'n-b'],
        ],
      ),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.firstFailure.rule.type).toBe('required-output');
  });
});
