# Testing

## Automated tests (Vitest)

```bash
npm run test         # run once
npm run test:watch   # watch mode
```

The domain and validation layers are pure (no React), so they are tested directly. Test files
live next to the code they cover (`*.test.ts`).

### Coverage in this session

**Domain (`src/domain/`)**
- A composable chain (`target(mi) === source(m(i+1))`) composes; a type-mismatched chain is rejected.
- An identity morphism `A → A` composes correctly.
- The composite of a 2-morphism path reports the correct overall source and target.

**Validation (`src/validation/`)**
- Puzzle 1: the reference solution passes all rules (`ok: true`).
- A graph ending at the wrong object fails `required-final-object` with a clear first-failure.
- A graph using a disallowed morphism fails `allowed-morphisms-only`.
- `path-equivalence` accepts two declared-equivalent paths and rejects mismatched endpoints.

**Schemas (`src/schemas/`)**
- Puzzle 1 JSON parses successfully.
- A deliberately malformed fixture throws with a useful path in the error.
- Every bundled puzzle JSON (incl. stubs 2–5) parses against the schema.

### Planned (next session)
- React Flow adapter unit tests (domain graph ↔ RF nodes/edges round-trip).
- Component tests for `PuzzleCanvas`, theme switching, formal reveal.
- Playwright browser flows.

## Manual QA checklist

Must at minimum cover Puzzle 1; ideally all implemented puzzles. The full Puzzle-1 flow below
becomes runnable once the next-session UI lands — until then, the domain/validation half is
exercised by the automated tests above.

### Puzzle 1 — full flow (next session)
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

### Foundation smoke check (this session)
1. `npm install` completes cleanly.
2. `npm run build` succeeds with no TypeScript errors (strict mode).
3. `npm run dev` serves the route shell without runtime errors.
4. `npm run test` — all domain / validation / schema tests pass.
