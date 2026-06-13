# Categorium — Spec

> Implementation-oriented condensation of the project handoff. This is the contract the code
> follows. Keep it current as the source of truth for architecture and the Chapter-1 MVP.

## 1. Vision

Categorium teaches **category theory** through interactive transformation puzzles. Players
start with concrete metaphors (machines, ports, wires, items) and only later discover these
are category-theory ideas. It is a **reusable platform**, not a one-off game: the first game
mode is a visual-programming / Zachtronics-style / proof-builder hybrid.

**Educational rule:** prefer simplicity, but never teach something false. Use simplified
language first; clarify in formal reveals and the glossary; mark rough intuitions as such.

**Audience:** mixed. Default onboarding requires no programming knowledge — the theme
metaphor carries the experience. Code/programmer analogies appear only when the player
enables them.

## 2. Architecture — strict layer separation (the load-bearing rule)

Formal category-theory names, game/UI names, and theme vocabulary must not mix across layers.

| Layer | Lives in | Vocabulary | React? |
|---|---|---|---|
| Domain (category logic) | `src/domain/` | `CategoryObject`, `Morphism`, `Path`, `Composition`, `Diagram` | **No** |
| Validation engine | `src/validation/` | rule types, `validatePuzzle` | **No** |
| Schemas | `src/schemas/` | Zod schemas + parsers | No |
| Local data | `src/data/` | puzzle/theme/glossary JSON | n/a |
| Theme system | `src/themes/` | `ThemeId`, label resolution (presentation only) | No |
| Glossary | `src/glossary/` | entry types, unlock tracking | No |
| Progress state | `src/state/` | Zustand store (localStorage) | hook |
| React Flow adapter | `src/flow/` | maps domain graph ↔ RF nodes/edges | Yes |
| UI | `src/ui/` | `MachineNode`, `Wire`, `PuzzleCanvas`, `ObjectTerminal` | Yes |
| Dev tools | `src/devtools/` | debug panel | Yes |

Invariants (each is a testable acceptance criterion):
- Domain + validation are **pure** and unit-testable with no React import.
- The **theme layer maps ids → display labels only**; it must never affect validation.
- Theme/metaphor names appear only in theme text, puzzle display labels, or UI — never in domain.
- Add a concise comment where a formal term maps to a game term.

## 3. Domain model

Unary morphisms for the MVP (one source object → one target object), but typed so that
products/sums/multi-input are not painful to add later (extension point marked in code).

```ts
type ThemeId = 'data' | 'alchemy' | 'spellcraft' | 'abstract';

type CategoryObject = {
  id: string;                          // stable internal id
  formalLabel?: string;                // 'A', 'B', 'C' (auto-generated if missing)
  labels: Record<ThemeId, string>;     // theme display names
  description?: Record<ThemeId, string>;
  icon?: string;
  colorToken?: string;
};

type Morphism = {                      // a "machine" in the UI
  id: string;
  formalLabel?: string;                // 'f', 'g', 'h'
  sourceObjectId: string;
  targetObjectId: string;
  labels: Record<ThemeId, string>;
  description?: Record<ThemeId, string>;
  examples?: SampleExample[];
};

type Path = { id: string; morphismIds: string[] };

type Composition = {                   // result of composing a Path
  sourceObjectId: string;
  targetObjectId: string;
  morphismIds: string[];
};

type Diagram = {
  objects: CategoryObject[];
  morphisms: Morphism[];
  paths?: Path[];
  equivalences?: PathEquivalence[];
};
```

Composition: a path `[m0, m1, …]` is composable iff `target(mi) === source(m(i+1))`. The
composite `g ∘ f` means *do f first, then g*; its source is `source(f)`, target is `target(g)`.

Path equivalence (MVP): determined by **puzzle-declared** equivalence rules, optionally
corroborated by running declared sample values through both paths. The app does **not** infer
deep categorical equality automatically — this is stated explicitly in code comments.

## 4. Puzzle & validation schema

Puzzles are hand-authored JSON, validated by Zod on load. Malformed puzzles fail loudly in
dev and are excluded from the chapter map for players.

```ts
type ConceptTag =
  | 'object' | 'morphism' | 'typed-transform'
  | 'composition' | 'identity' | 'commutative-diagram';

type PuzzleValidationRule =
  | { type: 'type-valid-wiring' }                       // every wire connects compatible ports
  | { type: 'required-output'; inputValueId: string; outputValueId: string } // behavior: run it
  | { type: 'required-final-object'; objectId: string }
  | { type: 'allowed-morphisms-only'; morphismIds: string[] }  // a *wired* machine counts
  | { type: 'path-equivalence'; leftPathId: string; rightPathId: string }
  | { type: 'concept-tag-required'; conceptTag: ConceptTag };

type Puzzle = {
  id: string;
  chapterId: string;
  order: number;
  title: Record<ThemeId, string>;
  conceptTags: ConceptTag[];
  intro: Record<ThemeId, string>;
  goal: Record<ThemeId, string>;
  objects: CategoryObject[];
  morphisms: Morphism[];
  initialGraph: PuzzleGraph;
  allowedMorphismIds: string[];
  validation: PuzzleValidationRule[];
  samples?: SampleValue[];
  reveal: FormalReveal;
  glossaryUnlocks: string[];
  referenceSolution?: PuzzleGraph;
};
```

`validatePuzzle(puzzle, playerGraph)` evaluates rules in order and returns the **first**
failing rule with a theme-first message and an optional "near concept" hint. **Multiple valid
solutions are allowed.** There is no fail state — invalid constructions simply cannot complete
a puzzle.

**Behavior puzzles (value runtime).** A machine may carry an `action` table (input
sample-value id → output value id); `src/domain/evaluate.ts` runs a value through a wired path,
*jamming* if a machine can't process what reaches it. A puzzle with `samples` + a
`required-output` rule is a **behavior puzzle**: it's solved by producing the right output
*value*, so two same-typed machines are distinguishable by what they do, and the player
**predicts then runs** (the sample token shows the real transformation). Equivalence is then
checked by actually running values, not just declared. The wiring chapters (1, 2, 3, 4, 5) use
this; Chapter 6 (natural transformations) is a different puzzle kind with its own validator.
Behavior is additive and gated on data.

## 5. Themes

Four swappable themes share identical mechanics and validation; switching changes presentation
only and preserves the puzzle graph, progress, validation logic, and formal structure.

| ThemeId | Name | Note | Example |
|---|---|---|---|
| `data` | Data Refinery | recommended for programmers | Raw CSV → Clean Table |
| `alchemy` | Alchemy Workshop | materials/crafting | Ore → Ingot |
| `spellcraft` | Spellcraft System | magical systems | Spark → Flame |
| `abstract` | Abstract Machine World | pure mode | A → B |

Mapping example surfaced to the player: `Raw CSV = Ore = Spark = A`, `Parser = Smelter = Ignition = f`.

## 6. Curriculum — Chapter 1 (`chapter-01-transformations`, "The Shape of Transformation")

Teaches (through play; laws are implied, not yet formally taught): objects are things /
arrows are processes → typed transformations → composition → identity → equivalent paths
(commutative diagrams).

Teaching order per concept: theme/metaphor language → optional programmer analogy → formal
reveal (short first, expandable "more formal"). Formal notation is hidden by default and
unlocked concept-by-concept.

| Puzzle | Concept | Formal reveal |
|---|---|---|
| 1 One Transformation | object / morphism | `f: A → B` |
| 2 Choose the Valid Transformation | typed transform | type-matched ports |
| 3 Chain Two Transformations | composition | `g ∘ f : A → C` |
| 4 Use Identity | identity | `id_A : A → A`  (analogy `x => x`) |
| 5 Equivalent Paths | commutative diagram | `g ∘ f = k ∘ h` |

Chapters 2–6 are **authored** (23 puzzles total): Ch2 laws of composition, Ch3 isomorphisms,
Ch4 functors, Ch5 products & coproducts, Ch6 natural transformations. Chapter 4 teaches functors
as **lifting**: behavior puzzles where a functor `F` lifts each machine into a boxed world
(`F(f) : F(A) → F(B)` does the same job inside the box), so the laws are felt on real values —
`F(id) = id` and `F(g ∘ f) = F(g) ∘ F(f)` — and an *impostor lift* (same boxed type, wrong
behavior) is told apart only by running it. Only Chapter 6 (natural transformations) introduces
its own puzzle **kind** with a dedicated board + validator: `kind: "natural-transformation"`
(`NaturalTransformationCanvas` / `validateNaturalTransformation`, choose a component at each
object; naturality is checked genuinely against an author-declared composition table). All other
puzzles are transformation (wiring/behavior) puzzles. The full curriculum arc, the worked complex
example, and the engine-extension map live in [`ROADMAP.md`](./ROADMAP.md).

## 7. Glossary

Concise entries for: object, morphism/arrow, composition, identity, commutative diagram.
Terms unlock as encountered. Each entry: theme-language definition first, formal definition
second, optional programmer analogy, optional notation examples.

## 8. Progress

Zustand persisted to localStorage. No accounts, no backend. Tracks: completed puzzles,
unlocked concepts, selected global theme, glossary unlocks, in-progress graph per puzzle.
Player can reset the current puzzle (preserves completed status, confirmation required) or
clear all progress (separate, in settings/dev).

## 9. Routing

React Router. Routes: theme selection, chapter map, puzzle screen, glossary, settings.
Puzzle URL: `/chapter/chapter-01-transformations/puzzle/puzzle-01`. Locked-puzzle URLs show a
locked screen; debug mode (`?debug=true`) can open any puzzle.

## 10. MVP scope vs deferred

**Session 1 (this foundation, built):** docs, scaffold, pure domain + validation core, Zod
schemas, fully-authored Puzzle 1 + stubbed Puzzles 2–5, themes & glossary data, progress
store skeleton, real `.claude/` skills & agents, Vitest tests.

**Deferred (next session — the playable vertical slice):** React Flow adapter & puzzle
canvas (object terminals, machine nodes, ports, wires), live + Run/Check validation, sample
animation, theme-switch UI, formal-reveal UI, glossary popovers/page, debug panel, app-start
screens (theme cards, chapter map, settings).

**Out of MVP entirely:** authoring UI, backend/auth/analytics, sound, scoring/achievements,
full mobile graph editing, products/sums/multi-input morphisms.

## 11. Tech stack

Vite · React · TypeScript (strict) · React Flow · Zustand · Zod · React Router · Vitest ·
Tailwind CSS · Lucide icons. Relative imports (no path aliases unless imports get painful).
No large UI component library; plain React + Tailwind. Radix only where it clearly helps a11y.
Minimal CSS transitions; avoid Framer Motion. Playwright added later for browser flows.
