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
- `initialGraph` — nodes/edges the puzzle starts with. In classic mode this pre-places every
  object and machine; in **toolkit mode** it pins only the start/goal objects.
- `toolkit` *(optional)* — `{ paletteObjectIds, paletteMorphismIds }`. When present, those pieces
  start in a side **tray** and the player clicks them onto the board (then wires them), choosing
  *which* objects/arrows to use; distractors are left in the tray. Purely additive — the validator
  only sees the final built graph. See `## Toolkit mode` below.
- `allowedMorphismIds` — the machines the player may use (the permitted superset; in toolkit mode
  this is what the tray offers).
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
| `required-output` | **Behavior**: running `inputValueId` through the wired path (machine `action` tables, `domain/evaluate.ts`) must produce `outputValueId`. A same-typed but wrong-behaved machine fails; a machine that can't process its input jams. |
| `required-final-object` | The constructed path must end at this object/type. |
| `allowed-morphisms-only` | Only these machines/morphisms may be used (a *wired* machine counts; merely placed distractors do not). |
| `path-equivalence` | Two declared paths must be equivalent (commutative diagram). |
| `concept-tag-required` | The solution must exercise this concept (`composition` needs ≥2 chained machines; `identity` needs a wired self-loop machine). |

Path equivalence uses **puzzle-declared** equivalence, optionally corroborated by running
sample values through both paths. The engine does not infer deep categorical equality.

## Toolkit mode

Originally every puzzle pre-placed all objects and machines and the player's only verb was *draw
a wire* — "connect the dots." **Toolkit mode** (the optional `toolkit` field) instead pins only
the start/goal objects and puts the candidate objects *and* machines in a side tray (rendered by
`ToolkitPalette`). The player **clicks a tray piece to place it** (then wires it), and can send a
placed piece back with its ✕ or the Delete key. This gives real agency — *which* pieces to use and
*how* to route them — and distractors (a lying shortcut, a same-typed wrong machine) are simply
left in the tray. It reuses the entire wiring/validation/notation stack: a placed node is built by
the same adapter code as a pre-placed one, and the validator only ever sees the final built graph,
so **no validation change**. A puzzle without `toolkit` behaves exactly as before. **All
transformation chapters (1–5, 7, 8) use toolkit mode**; the natural-transformation (6, 9) and
matching (10, 11) boards already make the player pick components/pairs and keep their own UI.

## Abstract-theme clarity (the "blend" convention)

In the flavored themes a machine's behavior is obvious from its words ("cleans" vs "wrecks"); in the
**Abstract** theme the symbols are bare, so two same-typed machines once looked identical. Every
transformation chapter now follows a blend:
- **Concrete example values** where they make behavior self-evident (Ch1–3): identity `5 ↦ 5`,
  a look-alike `5 ↦ 7`, associativity `2 →3 →6 →16` reaching the same number either way, a true
  inverse returning the original (`3 ↦ 3● ↦ 3`).
- **Keep + define structural notation** where concreteness can't carry the idea (Ch4 `F(…)`, Ch5
  `(a,b)`/`π`/`⟨f,g⟩`/`[f,g]`/`ι₁`, Ch7 `Just`/`Nothing`/`[…]`, Ch8 terminal `1`/equalizer/pullback):
  the abstract `intro` defines the notation in one clause (the way Ch1 defines `b′` = "a different
  value of the same type"), and carried values are concrete (`F(3)`, `(3,4)`, `Just 3`).
- **Every** morphism's abstract `description` states what it DOES (shown on the tray card + hover),
  never a bare `"a morphism A → B"`. The Test-case panel colors the required output (emerald) vs a
  produced wrong value (rose, "≠ required output").

## Chapter 1 — `chapter-01-transformations`  *(behavior + toolkit)*

> "The Shape of Transformation." Object/morphism → typed transform → composition → identity →
> commutative diagram. Built around the behavior runtime (`samples` + machine `action` tables + a
> `required-output` rule), so it's solved by producing the right output *value*, not by matching
> colors — and **converted to toolkit mode**: only start/goal are pinned, and the player brings the
> machines (and, from puzzle 3 on, the intermediate objects) onto the board from the tray, leaving
> the type-valid-but-wrong distractors behind. The player **predicts then runs**.

| Puzzle | Concept | The consideration |
|---|---|---|
| 1 One Transformation | object / morphism | two `A→B` machines (Parser vs **Shredder**); only one makes the *clean table*. Same color, different result. |
| 2 Choose the Valid Transformation | typed transform | one machine has the wrong source type (won't connect / jams); of the ones that fit, only one produces the goal value. |
| 3 Chain Two Transformations | composition | a palette of `A→B` and `B→C` machines; a wrong intermediate **jams** the second machine or yields the wrong chart — only one chain's *behavior* reaches the goal. |
| 4 Use Identity | identity | the goal value **equals** the input; Pass Through returns it unchanged, the look-alike **Smudger** alters it — "do nothing" is now observable. |
| 5 Equivalent Paths | commutative diagram | build a second route that produces the **same value** as the known route; the decoy finisher makes a *different* report. Commutativity checked by running the value. |

Design notes:
- Machine behavior is a declared `action` table (`domain/evaluate.ts`); a missing entry = the
  machine jams on that input. Two same-typed machines therefore differ in what they produce.
- Color is now a *gentle* aid, not the answer key: the meaningful distractors share type/color.
- Chapters 2–6 remain structural (no `samples`/`required-output`); behavior is additive and gated.

## Chapter 2 — `chapter-02-laws`  *(behavior; fully authored)*

> "The Laws of Composition." **Rebuilt around the behavior runtime** (`samples` + `action` tables
> + `required-output`): each law is felt on real values. A fake identity (the Smudger) is the same
> type but alters the value and **jams** the next machine; a fake `g∘f` bundle produces the wrong
> chart Reporter can't use. The genuine identity / composite is the one that actually behaves.

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

## Chapter 3 — `chapter-03-isomorphisms`  *(behavior; fully authored)*

> "Sameness, Both Ways." **Behavior runtime**: an inverse is checked by **round-tripping the
> value** — a same-typed decoder that returns a corrupted/different value (or a lossy finisher)
> is rejected; only the genuine inverse restores the original. P12 offers three decoders to weigh.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 10 Build the Inverse | `g ∘ f = id_A` | round-trip wired; `path-equivalence([f,g], [id_A])` |
| 11 The Other Way | `f ∘ g = id_B` | the dual round-trip |
| 12 Choose the True Inverse | only the real inverse returns home | a lossy `B→C` distractor fails `type-valid-wiring` / `required-final-object` |
| 13 Same as Same | isomorphisms compose (`A ≅ B ≅ C`) | chain two isos; `required-final-object` + `allowed-morphisms-only` |

Honesty: inverse round-trips are author-*declared* (the engine checks endpoints + return, not
that values round-trip). Stated in the reveals.

## Chapter 4 — `chapter-04-functors`  *(behavior; fully authored)*

> "Maps Between Worlds." Functors as **lifting**: a functor `F` (a Batch/List world) lifts each
> machine into a boxed world — `F(f) : F(A) → F(B)` does the same job inside the box. These are
> ordinary behavior puzzles (`samples` + machine `action` tables + a `required-output` rule,
> validated by `validatePuzzle`); the plain-world pipeline is shown read-only via a puzzle's
> `referenceDiagram` so "a functor transports a whole diagram" is visible beside the boxed board.
> Distractors are **impostor lifts** — same boxed type, wrong behavior — told apart only by running.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 14 Lift a Machine | `F` sends `f` to `F(f)` (lift the Cleaner over a batch) | run `box(raw)` → must reach `box(clean)`; the impostor crumples each item |
| 15 Lift a Pipeline | `F(g∘f) = F(g)∘F(f)` | lifting each step **or** the pre-lifted composite both land the same `box(chart)` |
| 16 A Faithful Functor | `F(id) = id`; the laws *are* the definition | the lifted identity leaves `box(a)` unchanged; a "tampering" identity-lift jams the next machine |

The functor laws are felt on real values: lifting a do-nothing does nothing, and lifting a
composite equals composing the lifts. (No separate functor puzzle *kind* — it was retired in
favor of these behavior puzzles; `domain/functor.ts` lives on for Chapter 6.)

## Chapter 5 — `chapter-05-products`  *(behavior; fully authored)*

> "Combining and Choosing." Products and coproducts via their **universal properties**, now
> **behavior-checked**: a look-alike projection returns the wrong component, a swapped pairing
> misorders the record, and the coproduct's case-split must handle **both** injected cases
> (two `required-output` rules) — all checked on real values.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 17 Project Out | a product has projections `π₁, π₂` | wire `A×B → π₁ → A`; `type-valid-wiring` + `required-final-object` |
| 18 Pair It Up | product universal property | `π₁∘⟨f,g⟩ = f`, `π₂∘⟨f,g⟩ = g` via two `path-equivalence`s |
| 19 Either Way | coproduct (dual) | `[f,g]∘ι₁ = f`, `[f,g]∘ι₂ = g` |
| 20 Make a Copy | the diagonal `Δ = ⟨id, id⟩` | `π₁∘Δ = π₂∘Δ = id_A` |

## Chapter 6 — `chapter-06-natural-transformations`  *(fully authored — a third puzzle kind)*

> "Between the Maps." A natural transformation `α : F ⇒ G` is a component `α_A : F(A) → G(A)` at
> every object of C, with all naturality squares commuting. Puzzles use
> `kind: "natural-transformation"`: two categories C and D (D with a **composition table**), two
> functors `functorF`/`functorG`, and `referenceComponents`. The board is the
> `NaturalTransformationCanvas`; the check is `validateNaturalTransformation`.

| Puzzle | Concept | How it's validated |
|---|---|---|
| 21 Build a Transformation | a family of components (`safeHead : List ⇒ Optional`) | totality + component typing `α_A : F(A) → G(A)` |
| 22 Make the Square Commute | naturality — typed isn't enough | **genuine** naturality: the engine computes `α_B∘F(f)` vs `G(f)∘α_A` from D's composition table; `headOrDefault` (typed but non-natural) fails |
| 23 The Identity Transformation | `id_F : F ⇒ F` (F = G) | identity components commute trivially; a `pad` distractor breaks the square |

This is the engine's **most genuine** check: naturality is computed against D's author-declared
composition table, not merely declared. The remaining trust is that the table faithfully
describes D.

See [`ROADMAP.md`](./ROADMAP.md) for the arc beyond Chapter 6.

## Authoring checklist

- [ ] All four `ThemeId` keys present in every `Record<ThemeId, string>`.
- [ ] Every `sourceObjectId` / `targetObjectId` references an object in the puzzle.
- [ ] `allowedMorphismIds` reference morphisms that exist.
- [ ] At least one validation rule pins the required result.
- [ ] `glossaryUnlocks` reference real glossary ids.
- [ ] `referenceSolution` actually satisfies the validation rules (covered by tests).
- [ ] Puzzle parses against `puzzle.schema.ts` (covered by the "all puzzles parse" test).
