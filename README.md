# Categorium

A category-theory learning game platform. Players solve transformation puzzles using concrete
metaphors (machines, ports, wires) and gradually discover the category-theory ideas underneath.
The first game mode is a visual-programming / Zachtronics-style / proof-builder hybrid.

See [`SPEC.md`](./SPEC.md) for the full design and architecture, and
[`PUZZLES.md`](./PUZZLES.md) for puzzle content structure.

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
| `npm run test` | Run the Vitest suite (domain, validation, schema) |
| `npm run test:watch` | Vitest in watch mode |

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
  flow/        React Flow adapter (domain graph ↔ RF nodes/edges)  — stub this session
  ui/          React components (game names)                       — route shell this session
  devtools/    debug tools                                         — stub this session
```

The central rule: formal category-theory names live only in `domain/`, game/metaphor names
only in `ui/`, theme vocabulary only in `data/` and `themes/`. Domain + validation are pure
and unit-testable without React.

## Current status (Session 1 — Foundation)

**Built and working:**
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

**Stubbed:**
- Puzzles 2–5 (id, chapter, order, concept tags, brief intro/goal only)
- `src/flow/` React Flow adapter (interface + TODO)
- `src/devtools/` debug panel
- UI screens render placeholders

**Deferred to next session (the playable vertical slice):**
React Flow puzzle canvas (terminals, machine nodes, ports, wires), live + Run/Check
validation, sample animation, theme-switch UI, formal-reveal UI, glossary popovers/page,
debug panel, app-start screens (theme cards, chapter map, settings).

**Known limitations:**
- No graph editing UI yet — the domain/validation core is exercised via tests, not the browser.
- Morphisms are unary only (products/sums/multi-input are a marked future extension point).
- No accounts/backend; progress is localStorage only.

## Next steps

1. Build the React Flow adapter in `src/flow/` and the `PuzzleCanvas` in `src/ui/`.
2. Wire Run/Check to `validatePuzzle`; add sample animation and success feedback.
3. Theme-switch UI, formal-reveal panel, glossary popovers.
4. Wire the progress store to the UI and the chapter map.
5. Add the debug panel and `?debug=true` flag handling.
