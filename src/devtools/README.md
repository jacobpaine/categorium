# devtools — STUB (next session)

Debug mode, enabled by the `?debug=true` URL flag. Planned panel surfaces:

- Raw puzzle JSON
- Parsed Zod result (and exact schema/path errors for broken puzzles)
- Current graph state
- Validation results (per-rule pass/fail)
- Unlocked concepts / progress state
- Theme mappings (e.g. `Raw CSV = Ore = Spark = A`)

Player-facing behavior: broken puzzles are excluded from the chapter map (handled already in
`src/data/index.ts`); debug mode shows the precise parse error instead.
