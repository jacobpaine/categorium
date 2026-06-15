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

## Toolkit mode (optional `toolkit` field)
`toolkit: { paletteObjectIds, paletteMorphismIds }` turns a transformation puzzle into a
choose-your-pieces board: pin ONLY the start/goal objects in `initialGraph`, and list every other
candidate object/morphism (correct pieces AND distractors) in the palette arrays. The player
clicks tray pieces onto the board and wires them; unused distractors stay in the tray. Rules are
unchanged — author them against the *built* graph exactly as in classic mode, and keep a full
`referenceSolution` (it still lists every authored node, including distractors, so the validation
tests' node fixtures resolve). Authoring tips: pinned nodes are detected by `role:"start"|"goal"`,
so always set roles; palette ids must exist in `objects`/`morphisms`; don't also pre-place a
palette piece in `initialGraph`. Omit `toolkit` entirely for classic pre-placed boards.
**Toolkit is the default for transformation puzzles** (chapters 1–5, 7, 8 all use it).

## Abstract-theme clarity (the "blend" convention)
Same-typed machines must NOT look identical in the Abstract theme. Every transformation puzzle:
(1) gives each morphism an `abstract` `description` that states BEHAVIOR via its `action` (e.g.
"sends 3 ↦ 4"), never a bare "a morphism A → B" (it shows on the tray card + hover); (2) uses
**concrete example values** for `samples[].abstract` where they make behavior self-evident (numbers
for identity/associativity/inverses — identity sends `n ↦ n`, a fake lands elsewhere); (3) for
**structural** ideas keeps the notation but DEFINES it in the abstract `intro` in one clause
(`F(x)`, `(a,b)`, `π₁`, `⟨f,g⟩`, `[f,g]`, `ι₁`, `Just`/`Nothing`, terminal `1`, prime `b′` = "a
different value of the same type") and makes carried values concrete (`F(3)`, `(3,4)`, `Just 3`).
Only the `abstract` strings change for this; leave flavored labels/descriptions alone.

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
