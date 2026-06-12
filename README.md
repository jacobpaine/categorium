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
- **Chapter 4 Functors** (3 puzzles): a genuine engine extension — `domain/functor.ts` +
  `validateFunctor` (totality + source/target preservation) and a new **FunctorCanvas** where
  the player draws object→object / morphism→morphism mapping edges between two categories
- **Chapter 5 Products & Coproducts** (4 puzzles): projections, the pairing universal property,
  the coproduct case-split, and the diagonal — engine-light via the universal-property model
  (unary morphisms only)
- New concept tags + glossary: isomorphism, inverse, functor, product, coproduct
- All reference solutions / mappings unit-tested; functor mapping covered by a new e2e

**Now: 20 puzzles across 5 unlocked chapters.**

**Deferred (next):**
Full keyboard graph construction (mouse-first for now), locked-puzzle deep-link screen,
e2e solves for the remaining puzzles, natural transformations (needs functor categories), and
true products-as-limits (needs multi-input morphisms).

**Known limitations:**
- Morphisms are unary only (multi-input/output is a marked future extension point); Chapter 5
  uses the universal-property model rather than literal product objects.
- `tracePath` follows a single linear path; the commutative-diagram puzzle (5) will consume
  declared `paths` rather than re-trace.
- Graph editing is mouse-first; no accounts/backend (progress is localStorage only).

## Next steps

1. Extend Playwright e2e to cover more puzzles across Chapters 2–5.
2. Keyboard-accessible graph construction; React Flow a11y pass (incl. the functor canvas).
3. Locked-puzzle deep-link screen (opening a not-yet-unlocked puzzle by URL).
4. Chapter 6: natural transformations (needs functor categories) — see `ROADMAP.md`.

## Debug mode

Append `?debug=true` to any URL to unlock all chapters and show the on-screen debug panel
(live validation, theme mappings, graph/JSON, progress, content errors). It stays on for the
session; click the **DEBUG** badge in the header (or use `?debug=false`) to turn it off.
