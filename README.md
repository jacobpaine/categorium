# Categorium

A category-theory learning game platform. Players solve transformation puzzles using concrete
metaphors (machines, ports, wires) and gradually discover the category-theory ideas underneath.
The first game mode is a visual-programming / Zachtronics-style / proof-builder hybrid.

See [`SPEC.md`](./SPEC.md) for the full design and architecture,
[`PUZZLES.md`](./PUZZLES.md) for puzzle content structure, and
[`ROADMAP.md`](./ROADMAP.md) for the full curriculum arc and a worked complex example.

## Setup

```bash
npm install
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (strict) and build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite (domain, validation, schema, adapter) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright browser flow (solves Puzzle 1) |

## Project layout

```
src/
  domain/      formal category theory — pure, no React (CategoryObject, Morphism, Path, …)
  validation/  puzzle validation engine — pure
  schemas/     Zod schemas + loud parsers
  data/        local puzzle / theme / glossary JSON
  themes/      ThemeId + label resolution (presentation only)
  glossary/    glossary types + unlock tracking
  state/       Zustand progress store (localStorage)
  flow/        React Flow adapter (domain graph ↔ RF nodes/edges)
  ui/          React components (game names): screens/ + canvas/ (PuzzleCanvas, nodes)
  devtools/    debug tools                                         — stub
```

The central rule: formal category-theory names live only in `domain/`, game/metaphor names
only in `ui/`, theme vocabulary only in `data/` and `themes/`. Domain + validation are pure
and unit-testable without React.

## Current status (Sessions 1–2)

**Built and working (Session 1 — Foundation):**
- Documentation: `SPEC.md`, `README.md`, `PUZZLES.md`, `TESTING.md`, `DEPLOYMENT.md`
- Vite + React + TS (strict) + Tailwind + Router + Zustand + Zod + React Flow + Vitest scaffold
- Pure domain model: objects, morphisms, paths, composition, path-equivalence
- Pure validation engine: 4 rule types + `validatePuzzle`
- Zod schemas + loud parsers for puzzle / theme / glossary
- Puzzle 1 fully authored across all four themes (reveal, glossary unlocks, reference solution)
- Themes data (4) and glossary data (5 entries)
- Progress store skeleton (Zustand + localStorage)
- Real `.claude/` skills (5) and agents (3)
- Vitest tests: domain, validation, schema parsing

**Built and working (Session 2 — playable vertical slice):**
- React Flow adapter (`src/flow/adapter.ts`): the sole domain ↔ RF bridge (`toReactFlow` /
  `fromReactFlow`), with a round-trip test
- `PuzzleCanvas` with custom `ObjectTerminal` (start/goal terminals) and `MachineNode` nodes,
  type-colored ports, curved arrow wires, animated after Run
- Run/Check wired to `validatePuzzle`; theme-first failure feedback; success state
- Post-success formal reveal (theme language → notation → "more formal" → opt-in code analogy)
- App-start flow: theme selection cards → chapter map → puzzle screen
- Theme switching that preserves the constructed graph (parent remounts the canvas; the graph
  is restored from the saved progress)
- Glossary screen (unlocks gate entries) and Settings (theme + clear-all-progress)
- Progress store fully wired: completions, concept/glossary unlocks, per-puzzle saved graph

**Built and working (Session 3 — Chapter 1 content):**
- Puzzles 2–5 fully authored across all four themes (typed transform, composition, identity,
  commutative diagram), each with reference solution, reveal, and glossary unlocks
- New `type-valid-wiring` validation rule (type-checks every wire) — powers the distractor
  machines in puzzles 2 & 4; "used" now means *wired*, not merely placed
- Per-puzzle validation tests: every reference solution passes; type/identity/goal failures fail

**Built and working (Session 4 — completion flow + e2e):**
- Post-success flow: a **Next puzzle** button and a collapsible **read-only reference-solution**
  preview (the authored `referenceSolution`, previously unused in the UI)
- `PuzzleScreen` remounts per puzzle id, so navigating between puzzles resets state cleanly
- **Playwright e2e** (`npm run test:e2e`): drives a real browser to draw wires and solve Puzzle 1,
  plus the no-wires failure-hint path

**Built and working (Session 5 — Chapter 2 + roadmap):**
- [`ROADMAP.md`](./ROADMAP.md): the full curriculum arc (Ch1→functors→universal constructions)
  plus a worked complex example expressed in real domain/validation terms
- **Chapter 2 "The Laws of Composition"** authored: 4 puzzles across all themes — right/left
  identity, identities-anywhere, and associativity (via *composite machines*). No `validatePuzzle`
  change: the laws ride on the existing `path-equivalence` rule
- Multi-chapter infrastructure: sectioned chapter map, `isChapterUnlocked`, and puzzle loading
  via `import.meta.glob` (adding a chapter = dropping a JSON file); titled placeholders for
  Ch3 (isomorphisms) and Ch4 (functors)
- New `identity-law` / `associativity` concept tags + glossary entries

**Built and working (Session 6 — sample-value animation):**
- On a successful Run, a sample token animates along the solved path, carrying the value as it
  transforms through each machine (e.g. "messy spreadsheet" → "Clean Table"), with a completion
  pulse. Lives in its own canvas state (never leaks into the validated graph); respects
  `prefers-reduced-motion`; verified in the Playwright e2e
- Uses authored `samples` where present, falling back to object labels

**Built and working (Session 7 — debug mode):**
- `?debug=true` enables a session-sticky debug mode (a header **DEBUG** badge toggles it off)
- **Dev unlock**: every chapter/puzzle is reachable without finishing prior chapters
- **DebugPanel** on the puzzle screen: live per-rule validation against the constructed graph,
  theme mappings, graph + puzzle JSON, progress state, content load errors, and quick actions
  (mark complete / reset graph / clear progress); e2e-covered

**Built and working (Session 8 — Chapters 3–5):**
- **Chapter 3 Isomorphisms** (4 puzzles): inverses, two-sided round-trips, choosing the true
  inverse, composing isos — engine-light via `path-equivalence` to identity paths
- **Chapter 4 Functors** (3 puzzles): functors as **lifting**, built on the behavior runtime —
  a functor `F` lifts each machine into a boxed world (`F(f) : F(A) → F(B)`), so the laws are
  felt on real values (`F(id)=id`, `F(g∘f)=F(g)∘F(f)`) and an impostor lift (same boxed type,
  wrong behavior) is caught by running it. The plain pipeline `F` transports is shown read-only
  via `referenceDiagram`. (The old chip-mapping FunctorCanvas / `validateFunctor` was retired.)
- **Chapter 5 Products & Coproducts** (4 puzzles): projections, the pairing universal property,
  the coproduct case-split, and the diagonal — engine-light via the universal-property model
  (unary morphisms only)
- New concept tags + glossary: isomorphism, inverse, functor, product, coproduct
- All reference solutions unit-tested; Chapter 4 lifting covered by a new e2e

**Built and working (Session 9 — Chapter 6 Natural Transformations):**
- A second real engine extension (functor categories): `domain/naturalTransformation.ts` with an
  author-declared **composition table** on D, so naturality is checked *genuinely* —
  `checkNaturalTransformation` computes `α_B∘F(f)` vs `G(f)∘α_A` and compares. A correctly-typed
  but non-natural family really fails (more honest than declared commutativity elsewhere).
- A new **NaturalTransformationCanvas**: the player draws a component `α_A : F(A) → G(A)` at each
  object of C, between two given functors F, G.
- 3 puzzles: build a transformation (`safeHead : List ⇒ Optional`), make the square commute, and
  the identity transformation. New glossary entry + a browser e2e.

**Now: 23 puzzles across 6 unlocked chapters.**

**Built and working (Session 10 — behavior runtime, piloted on Chapter 1):**
- A **value runtime** (`domain/evaluate.ts`): machines carry a declared `action` table (input
  sample-value → output value); `runChain` folds a value through a path, jamming if a machine
  can't process what reaches it. Two same-typed machines now produce different results.
- New **`required-output`** rule: the wired path must turn the input value into the goal value —
  so a same-colored, wrong-behaved machine fails. Color-matching no longer solves puzzles.
- **Predict-then-run** UI (`BehaviorPanel`): the player predicts the output, then the sample token
  animates the *real* value transforming through the machines (with visible jams) and reports what
  was produced and whether the prediction was right.
- **Chapter 1 rebuilt** around behavior with type-valid-but-wrong distractors; equivalence (P5) is
  now checked by actually running values. Addresses "the game only drags arrows between colors."

**Built and working (Session 11 — behavior rollout to Chapters 2–6):**
- **Chapters 2, 3, 5** (the wiring chapters) rebuilt around behavior: laws via fake-identity /
  fake-composite distractors (a Smudger jams the next machine); isomorphisms checked by
  **round-tripping the value** (a lossy decoder returns a corrupted file); products/coproducts/
  diagonals checked on real component values (the coproduct must handle **both** cases).
- **Chapter 6** (natural transformations) left as-is — it already *computes* naturality and its
  puzzles carry type-valid distractors.
- Every chapter now forces real consideration; color/type matching alone never solves a puzzle.

**Built and working (Session 12 — Chapter 4 rethought as lifting):**
- The chip-mapping functor puzzle kind (FunctorCanvas / `validateFunctor`) is **retired**.
  Chapter 4 is now three **behavior** puzzles: a functor `F` lifts each machine into a boxed
  world, so the laws are felt on values — `F(id)=id` and `F(g∘f)=F(g)∘F(f)` — and an *impostor
  lift* (same boxed type, wrong behavior) is caught only by running it.
- New optional `referenceDiagram`/`referenceLabel` renders the plain pipeline `F` transports
  read-only (via `SolutionPreview`) beside the boxed board, so it reads as a functor.
- `domain/functor.ts`, `FunctorChipNode`, and the small-category schemas are kept for Chapter 6.

**Built and working (Session 13 — interactive introduction + hover-cards):**
- **Walkthrough ("Chapter 0")** — a 5-step interactive introduction (`/intro`, `TourScreen`)
  that teaches the confusing core terms on REAL game boards, theme-aware: morphism/transformation
  → composition → identity → isomorphism → functor (lifting). Each step is a playable behavior
  puzzle reusing the whole engine (`tour.json` + `tour.schema.ts`, `TOUR` loader); finishing a
  step unlocks its glossary entry. Linked from the header and a CTA on the theme picker.
- **Hover-cards on every element** — pointing at any object or machine pops an instant styled
  card (`NodeHoverCard`): name + formal role/label (`Object · A` / `Process · f`) + type
  signature (`A → B`) + a one-line, theme-flavored description (with a generic role fallback, so
  it's useful even where no description is authored). Replaces the weak native `title` tooltip.
- Content: every morphism now carries a `description`; Chapter-1 objects too; the `functor`
  glossary entry reworded around lifting.

**Built and working (Session 14 — notation box, harder capstones, quiz):**
- **Live notation box** (`NotationBox` + `notation.ts`) at the bottom of the board: selecting an
  object writes `A`, wiring an arrow writes `f : A → B`, and a chain writes the right-to-left
  composite `h ∘ g ∘ f : A → D` — in both formal symbols and theme language — so the player learns
  to *write* the example they built. Shows on the standard board (chapters 1–5 and the walkthrough).
- **A harder capstone at the end of every chapter** (`puzzle-c1…c6`): a lying one-step shortcut
  (Ch1), associativity with buggy bundles (Ch2), inverting a composite isomorphism (Ch3), lifting a
  whole pipeline past impostors (Ch4), pair-then-project (Ch5), and a three-object / two-square
  naturality puzzle (Ch6). None solvable by color-matching; each has distractor-rejection tests.
- **Quiz tab** (`/quiz`, `QuizScreen`, `quiz.json`): two theme-aware questions per glossary term
  (26 total) that map each theme's words to the category theory they stand for, with immediate
  feedback, an explanation, and a running score; switching theme re-themes the questions.
- Chapter 6's flavored themes reworked to concrete, defined containers (a rack of vials / a stack
  of runes) instead of the undefined Swarm/Echo/Batch metaphors; the formal-labels toggle now
  updates the board live; hover-cards added to the natural-transformation board.

**Deferred (next):**
Keyboard graph construction; locked-puzzle deep-link screen; composing natural transformations;
products-as-limits (multi-input morphisms); broaden e2e coverage.

**Known limitations:**
- Morphisms are unary only (multi-input/output is a marked future extension point); Chapter 5
  uses the universal-property model rather than literal product objects.
- `tracePath` follows a single linear path; the commutative-diagram puzzle (5) will consume
  declared `paths` rather than re-trace.
- Graph editing is mouse-first; no accounts/backend (progress is localStorage only).

## Next steps

1. Roll the **behavior runtime** out to Chapters 2–6 (the Ch1 pilot proved the mechanic).
2. Chapter 7: composing natural transformations (the functor-category algebra) — see `ROADMAP.md`.
3. Keyboard-accessible graph construction; React Flow a11y pass (incl. the NT canvas).
4. Locked-puzzle deep-link screen; extend e2e across more puzzles.

## Debug mode

Append `?debug=true` to any URL to unlock all chapters and show the on-screen debug panel
(live validation, theme mappings, graph/JSON, progress, content errors). It stays on for the
session; click the **DEBUG** badge in the header (or use `?debug=false`) to turn it off.
