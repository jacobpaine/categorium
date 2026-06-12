---
name: qa-testing
description: Check Categorium schemas, validation rules, and puzzle completion paths. Use when adding tests or verifying a puzzle's reference solution and edge cases.
---

# qa-testing

Verifies the pure core and puzzle correctness with Vitest, plus manual QA.

## Run
```bash
npm run test        # once
npm run test:watch  # watch
npm run build       # strict type-check + production build
```

## What to cover
- **Schema**: every bundled puzzle parses (`safeParsePuzzle`); a malformed fixture fails with a
  useful path; themes & glossary parse strictly.
- **Domain**: composable vs type-mismatched chains; identity `A→A`; overall source/target of a
  multi-morphism path; cycle/branch guards in `tracePath`.
- **Validation**: each puzzle's `referenceSolution` returns `ok`; deliberately wrong graphs
  fail the expected rule first (wrong final object, disallowed morphism, missing concept).

## Conventions
- Tests live next to code as `*.test.ts`. Keep them React-free for the domain/validation
  layers so they stay fast and isolated.
- When adding a puzzle, add a validation test asserting its reference solution passes — this is
  the regression guard.

## Manual QA
Follow the checklist in `TESTING.md`. At minimum cover Puzzle 1 end-to-end once the canvas
exists; until then, the foundation smoke check (`install` / `build` / `test`) is the bar.
