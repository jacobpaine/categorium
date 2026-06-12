# Testing

## Automated tests (Vitest)

```bash
npm run test         # run once
npm run test:watch   # watch mode
```

The domain and validation layers are pure (no React), so they are tested directly. Test files
live next to the code they cover (`*.test.ts`).

### Coverage (32 unit tests across 7 files)

**Domain (`src/domain/`)**
- A composable chain (`target(mi) === source(m(i+1))`) composes; a type-mismatched chain is rejected.
- An identity morphism `A → A` composes correctly.
- The composite of a multi-morphism path reports the correct overall source and target.
- `tracePath` traces a linear construction and guards against cycles.
- `path-equivalence` (`checkParallel` / `arePathsEquivalent`) accepts declared-equivalent parallel
  paths and rejects mismatched endpoints / undeclared ones.

**Validation (`src/validation/`)**
- **Every authored puzzle's `referenceSolution` passes** (`puzzles.test.ts`).
- Puzzle 1: wrong final object fails `required-final-object`; a disallowed morphism fails
  `allowed-morphisms-only`.
- Puzzle 2: wiring a wrong-input or wrong-output machine fails `type-valid-wiring`.
- Puzzle 4: the `A → B` distractor and a direct thing-to-thing wire fail `type-valid-wiring`.
- Puzzle 5: building no second path fails `required-final-object`.

**Schemas (`src/schemas/`)**
- Puzzle 1 JSON parses; a malformed fixture fails with a useful path; all five bundled puzzles parse.

**Adapter (`src/flow/`)**
- `toReactFlow` maps the reference solution with theme labels and carried-through positions;
  `fromReactFlow` round-trips back to the domain graph.

## End-to-end tests (Playwright)

```bash
npm run test:e2e
```

Playwright starts the app (dev server on port 5174) and drives a real browser. Covered in
`e2e/puzzle1.spec.ts`:
- **Solve Puzzle 1:** select a theme → open the puzzle → drag wires (start → machine → goal) on
  the React Flow canvas → Run / Check → assert the success state, the "What you learned" reveal,
  and the Next-puzzle button.
- **Failure path:** Run with no wires → assert the "Not quite yet" hint and that success is absent.

This closes the gap the unit tests can't reach: actual wire-drawing on the canvas.

### Planned next
- Per-puzzle e2e solves for Puzzles 2–5 (esp. the typed-transform distractors and the
  commutative-diagram route).
- Component tests for theme switching preserving the graph, and the formal-reveal toggles.

## Manual QA checklist

`npm run dev`, then play through Chapter 1. The Puzzle-1 flow below is also automated in
`e2e/puzzle1.spec.ts`; run it by hand to sanity-check feel and visuals, and to cover puzzles
2–5 (not yet in e2e).

### Puzzle 1 — full flow
1. Start the app.
2. Select **Data Refinery**.
3. Enter Chapter 1.
4. Open Puzzle 1.
5. Confirm initial nodes render.
6. Try an invalid connection (if available).
7. Confirm a friendly error/warning appears.
8. Connect a valid path.
9. Press **Run / Check**.
10. Confirm animation / success feedback.
11. Confirm the formal reveal appears.
12. Switch theme.
13. Confirm the same graph remains.
14. Confirm labels change.
15. Open a glossary entry.
16. Reset the puzzle.
17. Confirm the graph resets but completed status remains.

### Puzzles 2–5 — spot checks
- **2 (typed transform):** wire a wrong machine → expect a "types don’t match" message; the
  correct machine solves it.
- **3 (composition):** one machine isn’t enough; chain both to reach the goal.
- **4 (identity):** the distractor that changes the type can’t reach the goal; the do-nothing
  machine can.
- **5 (commutative diagram):** build the alternate route (via D) to the same goal.
- After solving any puzzle: **Next puzzle** advances; **See a reference solution** shows a
  read-only diagram.

### Smoke check
1. `npm install` completes cleanly.
2. `npm run build` succeeds with no TypeScript errors (strict mode).
3. `npm run test` — all unit tests pass.
4. `npm run test:e2e` — Playwright browser flow passes.
