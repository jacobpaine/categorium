---
name: theme-writing
description: Write or revise Categorium theme vocabulary across Data Refinery, Alchemy, Spellcraft, and Abstract. Use when adding theme labels/flavor or checking that a theme change touches presentation only.
---

# theme-writing

Maps the same formal puzzle into all four themes without ever changing logic.

## The four themes
| ThemeId | Name | Voice | Example |
|---|---|---|---|
| `data` | Data Refinery | programmer-friendly | Raw CSV → Parser → Clean Table |
| `alchemy` | Alchemy Workshop | materials/crafting | Ore → Smelter → Ingot |
| `spellcraft` | Spellcraft System | magical systems | Spark → Ignition → Flame |
| `abstract` | Abstract Machine World | pure (A, f, B) | A → f → B |

## Hard rules
- A theme changes **colors, icons, labels, vocabulary, flavor text** only. It must NOT change
  the puzzle graph, validation, or formal structure. Switching themes preserves the player's
  graph and progress.
- Every `Record<ThemeId,string>` must include all four keys (the schema enforces this).
- The `abstract` theme is the canonical/pure skin: prefer `A`, `B`, `f` and minimal flavor.
- Keep theme card taglines short and practical.

## Consistency
- An object's role must read the same across themes (a "start input" is a raw thing in every
  theme). Keep the start→machine→goal shape recognizable.
- When useful, surface the mapping to the player, e.g. `Raw CSV = Ore = Spark = A`,
  `Parser = Smelter = Ignition = f`.

## Where this lives
`src/data/themes.json` (theme cards) and the per-theme `labels`/`description`/`title`/`intro`/
`goal`/`reveal.afterSuccess` fields in each puzzle JSON.
