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

## Chapter 2 — `chapter-02-laws`  *(fully authored)*

> "The Laws of Composition." Makes the laws Chapter 1 only implied explicit, and demonstrates
> each *by construction*. All four puzzles use the existing engine — **no validator change** —
> by riding on `path-equivalence`.

| Puzzle | Concept | How it's validated | Reveal |
|---|---|---|---|
| 6 Do Nothing First | identity law (right) | wire `id_A → f`; `concept-tag-required identity` forces the do-nothing step; `path-equivalence [id_A,f] ≡ [f]` | `f ∘ id_A = f` |
| 7 Do Nothing After | identity law (left) | wire `f → id_B`; same shape on the other side | `id_B ∘ f = f` |
| 8 Redundant Steps | identity law (capstone) | wire `id_A → f → id_B → g`; equals the clean `g ∘ f` | `g ∘ id_B ∘ f ∘ id_A = g ∘ f` |
| 9 Grouping Doesn't Matter | associativity | **composite machines** `gf : A→C`, `hg : B→D`; player wires `gf → h`; `path-equivalence [gf,h] ≡ [f,hg]` | `(h ∘ g) ∘ f = h ∘ (g ∘ f)` |

Design notes:
- The **identity law** puzzles force the do-nothing step with `concept-tag-required: identity`
  (auto-derived for any wired self-loop morphism), then formalize the law with a declared
  `path-equivalence` to the identity-free path.
- **Associativity** is made tangible with *composite machines*: `gf` bundles `g ∘ f` and `hg`
  bundles `h ∘ g`. The two groupings become two routes to `D` (`[gf,h]` vs `[f,hg]`); the
  `path-equivalence` rule confirms they're parallel. The non-bundled route is shown in the
  reveal, not placed on the editable canvas (same technique as Puzzle 5).
- `identity-law` and `associativity` are **display/glossary-only** concept tags — never used via
  `concept-tag-required` (they aren't auto-derived; `path-equivalence` carries the proof).

## Chapter 3 — `chapter-03-isomorphisms`  *(fully authored)*

> "Sameness, Both Ways." Reversible processes and lossless round-trips. Engine-light, like Ch2.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 10 Build the Inverse | `g ∘ f = id_A` | round-trip wired; `path-equivalence([f,g], [id_A])` |
| 11 The Other Way | `f ∘ g = id_B` | the dual round-trip |
| 12 Choose the True Inverse | only the real inverse returns home | a lossy `B→C` distractor fails `type-valid-wiring` / `required-final-object` |
| 13 Same as Same | isomorphisms compose (`A ≅ B ≅ C`) | chain two isos; `required-final-object` + `allowed-morphisms-only` |

Honesty: inverse round-trips are author-*declared* (the engine checks endpoints + return, not
that values round-trip). Stated in the reveals.

## Chapter 4 — `chapter-04-functors`  *(fully authored — a distinct puzzle kind)*

> "Maps Between Worlds." Functor puzzles use `kind: "functor"` and a different mechanic: two
> small categories (`sourceCategory`, `targetCategory`) and a `referenceMapping`. The board is
> the `FunctorCanvas` — chips for each object/morphism; the player draws mapping edges. The
> check is `validateFunctor` (`src/validation/`), not `validatePuzzle`.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 14 Map the Arrow | a functor on a 1-arrow category (List functor) | totality + source/target preservation |
| 15 Preserve Composition | `F(g∘f) = F(g)∘F(f)` | the composite must map to an `F(A)→F(C)` arrow |
| 16 Respect Every Arrow | object & morphism maps must agree (Optional functor) | a mis-aligned object map leaves an arrow un-mappable |

`checkFunctor` enforces totality + endpoint preservation; identity/composition preservation are
the stated laws (a mis-pointed image fails the structural check).

## Chapter 5 — `chapter-05-products`  *(fully authored)*

> "Combining and Choosing." Products and coproducts via their **universal properties** —
> projections/injections and a unique pairing/case-split, all *unary* morphisms. Engine-light.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 17 Project Out | a product has projections `π₁, π₂` | wire `A×B → π₁ → A`; `type-valid-wiring` + `required-final-object` |
| 18 Pair It Up | product universal property | `π₁∘⟨f,g⟩ = f`, `π₂∘⟨f,g⟩ = g` via two `path-equivalence`s |
| 19 Either Way | coproduct (dual) | `[f,g]∘ι₁ = f`, `[f,g]∘ι₂ = g` |
| 20 Make a Copy | the diagonal `Δ = ⟨id, id⟩` | `π₁∘Δ = π₂∘Δ = id_A` |

See [`ROADMAP.md`](./ROADMAP.md) for the arc beyond Chapter 5.

## Authoring checklist

- [ ] All four `ThemeId` keys present in every `Record<ThemeId, string>`.
- [ ] Every `sourceObjectId` / `targetObjectId` references an object in the puzzle.
- [ ] `allowedMorphismIds` reference morphisms that exist.
- [ ] At least one validation rule pins the required result.
- [ ] `glossaryUnlocks` reference real glossary ids.
- [ ] `referenceSolution` actually satisfies the validation rules (covered by tests).
- [ ] Puzzle parses against `puzzle.schema.ts` (covered by the "all puzzles parse" test).
