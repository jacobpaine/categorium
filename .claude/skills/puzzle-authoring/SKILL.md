---
name: puzzle-authoring
description: Create or edit Categorium puzzle JSON — objects, morphisms, initial graph, validation rules, reference solutions. Use when adding a puzzle or filling in a stub.
---

# puzzle-authoring

Authors puzzle JSON in `src/data/puzzles/` that conforms to `src/schemas/puzzle.schema.ts`.

## A puzzle is `authored` or `stub`
- `stub`: `status:"stub"` + id, chapterId, order, conceptTags, title, intro, goal. Lists on
  the chapter map as a preview/locked entry.
- `authored`: `status:"authored"` + the full body (objects, morphisms, initialGraph,
  allowedMorphismIds, validation, reveal, glossaryUnlocks, optional samples/paths/equivalences/
  referenceSolution).

## Graph model
Nodes are `{kind:"object", nodeId, objectId, role?}` or `{kind:"morphism", nodeId, morphismId}`.
Edges are `{id, sourceNodeId, targetNodeId}` (a wire). `initialGraph` is what the player starts
with; `referenceSolution` is the canonical completed graph.

## Validation rules (evaluated in order; first failure shown)
- `type-valid-wiring` — every wire must connect type-compatible ports (machine input/output
  must match the thing it's wired to; no thing-to-thing wires). This is what makes distractor
  machines meaningful — see `src/validation/wiring.ts`.
- `required-final-object` — the traced path must end at this object.
- `allowed-morphisms-only` — only these machines may be used. A machine merely *placed* on the
  canvas doesn't count; only a **wired** machine does (`morphismIdsUsed` in `src/domain/graph.ts`).
- `path-equivalence` — two declared `paths` must be parallel & author-equivalent.
- `concept-tag-required` — the constructed graph must demonstrate this concept
  (composition needs ≥2 chained morphisms; identity needs a wired self-loop morphism — see
  `src/validation/concepts.ts`). Note: `commutative-diagram` is NOT auto-derived, so don't
  require it via this rule — use `path-equivalence` instead.

## Distractor pattern (typed-transform / identity puzzles)
Place wrong-typed machines as extra morphism nodes in `initialGraph` (don't list them in a
restrictive `allowed-morphisms-only`); rely on `type-valid-wiring` + `required-final-object` so
a player who wires the wrong machine gets a type-mismatch explanation. Define the distractor's
off-type objects in `objects` even if they never appear as terminal nodes.

## Authoring checklist
- All four ThemeId keys present in every theme-text bundle (`data`, `alchemy`, `spellcraft`, `abstract`).
- Every `sourceObjectId`/`targetObjectId`/`allowedMorphismIds`/`glossaryUnlocks` resolves.
- At least one rule pins the required result.
- `referenceSolution` actually passes `validatePuzzle` (add/extend a test in
  `src/validation/*.test.ts`).
- Keep `intro` ≤ 5 sentences.

## Verify
`npm run test` includes an "every bundled puzzle parses" test and Puzzle-1 validation tests.
Add a validation test asserting the new puzzle's reference solution returns `ok`.
