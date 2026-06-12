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

**Stubbed:**
- `src/devtools/` debug panel

**Deferred (next):**
Sample-value animation through machines, debug panel + `?debug=true`, full keyboard graph
construction (mouse-first for now), locked-puzzle deep-link screen, e2e solves for puzzles 2–5.

**Known limitations:**
- Morphisms are unary only (products/sums/multi-input are a marked future extension point).
- `tracePath` follows a single linear path; the commutative-diagram puzzle (5) will consume
  declared `paths` rather than re-trace.
- Graph editing is mouse-first; no accounts/backend (progress is localStorage only).

## Next steps

1. Sample-value animation on Run; subtle completion effects.
2. Debug panel behind `?debug=true` (puzzle JSON, parse result, graph, validation, mappings).
3. Extend Playwright e2e to solve Puzzles 2–5.
4. Keyboard-accessible graph construction; React Flow a11y pass.
5. Locked-puzzle deep-link screen (opening a not-yet-unlocked puzzle by URL).
