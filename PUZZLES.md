# Puzzles

How Categorium puzzles are structured and authored. Puzzles are hand-authored JSON in
`src/data/puzzles/`, validated with Zod on load (`src/schemas/`). A puzzle that fails schema
validation is excluded from the chapter map for players and reported loudly in dev.

## Puzzle JSON shape

See `Puzzle` in [`SPEC.md` §4](./SPEC.md) and the Zod source in `src/schemas/puzzle.schema.ts`
for the authoritative shape. Key fields:

- `id`, `chapterId`, `order` — identity and placement on the chapter map.
- `title`, `intro`, `goal` — `Record<ThemeId, string>`; theme-specific player-facing text.
- `conceptTags` — which category-theory concepts the puzzle exercises.
- `objects`, `morphisms` — the local diagram. Each object/morphism carries per-theme `labels`
  and an optional `formalLabel` (`A`, `B`, `f`, …).
- `initialGraph` — nodes/edges the puzzle starts with (fixed pieces, pre-placed machines).
- `allowedMorphismIds` — the palette of machines the player may use.
- `validation` — ordered list of `PuzzleValidationRule`s (see below).
- `samples` — optional sample values that flow through machines in metaphor mode.
- `reveal` — formal reveal text/notation shown after completion.
- `glossaryUnlocks` — glossary term ids unlocked on completion.
- `referenceSolution` — read-only canonical solution shown after completion.

## Validation rules

Evaluated in order; the **first** failing rule is reported with a theme-first message.
Multiple valid solutions are allowed — rules describe constraints, not a single answer.

| Rule | Meaning |
|---|---|
| `type-valid-wiring` | Every wire must connect type-compatible ports (a machine's input/output type must match what it's wired to; no thing-to-thing wires). |
| `required-final-object` | The constructed path must end at this object/type. |
| `allowed-morphisms-only` | Only these machines/morphisms may be used (a *wired* machine counts; merely placed distractors do not). |
| `path-equivalence` | Two declared paths must be equivalent (commutative diagram). |
| `concept-tag-required` | The solution must exercise this concept (`composition` needs ≥2 chained machines; `identity` needs a wired self-loop machine). |

Path equivalence uses **puzzle-declared** equivalence, optionally corroborated by running
sample values through both paths. The engine does not infer deep categorical equality.

## Chapter 1 — `chapter-01-transformations`

> "The Shape of Transformation." Teaches object/morphism → typed transform → composition →
> identity → commutative diagram. Category laws are *implied through play*, not yet formally
> taught.

### Puzzle 1 — One Transformation  *(fully authored)*

Connect one machine from object A to object B. Formal structure `f: A → B`.

| Theme | Mapping |
|---|---|
| Data Refinery | Raw CSV → **Parser** → Clean Table |
| Alchemy Workshop | Ore → **Smelter** → Ingot |
| Spellcraft System | Spark → **Ignition** → Flame |
| Abstract Machine World | A → **f** → B |

- **Goal:** connect the starting thing to the machine, then the machine to the goal.
- **Intro (≤5 sentences):** "Every system begins with something that can be transformed. In
  this puzzle, you have one starting thing, one machine, and one goal. Connect them so the
  machine can turn the start into the goal."
- **After success:** "You built one valid transformation. In category theory, the things being
  transformed are called *objects*, and the process between them is called an *arrow* or
  *morphism*."
- **Formal reveal:** `A --f--> B`,  `f: A → B`. Programmer analogy (opt-in): `f: (input: A) => B`.
- **Glossary unlocks:** object, morphism.

### Puzzles 2–5 — *(fully authored)*

| Puzzle | Concept | How it's validated | Reveal |
|---|---|---|---|
| 2 Choose the Valid Transformation | typed transform — three machines, only one fits | `type-valid-wiring` (the two distractors are wrong-input / wrong-output) + `required-final-object` | type-matched ports, `f: A → B` |
| 3 Chain Two Transformations | composition `A → B → C` | `type-valid-wiring` + `required-final-object` C + `concept-tag-required composition` (≥2 chained) | `g ∘ f : A → C` ("do f first, then g") |
| 4 Use Identity | a do-nothing machine `A → A` (Pass Through / Preserve / Echo / Identity) | `type-valid-wiring` (distractor `f: A → B` can't reach goal A) + `required-final-object` A + `concept-tag-required identity` | `id_A : A → A`  (`x => x`) |
| 5 Equivalent Paths | build a second route to the same goal | `type-valid-wiring` + `allowed-morphisms-only [h,k]` + `required-final-object` C + `path-equivalence` of the two declared paths | `g ∘ f = k ∘ h` |

Notes on the design:
- A machine merely placed on the canvas is not "used"; only a **wired** machine counts (so
  puzzle 2/4 distractors don't trip rules until connected).
- Puzzle 5's known `f;g` route is described in the intro/reveal but not placed on the editable
  canvas — the player builds the alternate `h;k` route, and the `path-equivalence` rule
  confirms the two declared routes are parallel (`A → C`).

## Chapter 2 — `chapter-02-laws`  *(locked placeholder)*

"The Laws of Composition." Locked in the MVP. Likely topics: identity law, associativity law;
later, isomorphisms.

## Authoring checklist

- [ ] All four `ThemeId` keys present in every `Record<ThemeId, string>`.
- [ ] Every `sourceObjectId` / `targetObjectId` references an object in the puzzle.
- [ ] `allowedMorphismIds` reference morphisms that exist.
- [ ] At least one validation rule pins the required result.
- [ ] `glossaryUnlocks` reference real glossary ids.
- [ ] `referenceSolution` actually satisfies the validation rules (covered by tests).
- [ ] Puzzle parses against `puzzle.schema.ts` (covered by the "all puzzles parse" test).
