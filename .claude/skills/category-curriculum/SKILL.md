---
name: category-curriculum
description: Keep Categorium's category-theory explanations accurate and pedagogically ordered. Use when writing or reviewing intro/goal/reveal/glossary text, or deciding when a formal term is introduced.
---

# category-curriculum

Guards the hidden curriculum and the accuracy of every explanation in Categorium.

## Principles
- Prefer simplicity, but **never teach something false**. Use simplified language first;
  clarify in formal reveals and glossary entries; mark rough intuitions as such.
- Theme/metaphor language is the default. Programmer analogies and formal notation appear
  only when the player opts in, and only after the relevant concept is unlocked.

## Chapter 1 teaching order (one concept per puzzle)
1. Objects are things/types; arrows/morphisms are processes.
2. Typed transformations (not every machine connects to every type).
3. Composition — chain steps; `g ∘ f` means *do f first, then g*.
4. Identity — a do-nothing step `id_A : A → A` (`x => x`).
5. Equivalent paths / commutative diagram — same start & end, same result; `g ∘ f = k ∘ h`.

Chapter 1 implies the category laws *through play*; it does not yet formally state the
identity or associativity laws (that is Chapter 2).

## Per-concept reveal pattern
metaphor language → optional programmer analogy → short formal reveal → expandable
"more formal". Never lead with notation.

## Accuracy checks
- A "morphism" is an arrow with one source and one target — not necessarily a set-function.
  Say so in the formal definition; don't imply all arrows are functions.
- Composition requires `target(f) === source(g)`.
- Identity composes away: `f ∘ id_A = f`, `id_B ∘ f = f`.
- A diagram "commutes" when parallel paths are *equal as morphisms* — the app treats this as
  author-declared, not auto-proven (see `src/domain/equivalence.ts`).

## Where this lives in code
`src/data/glossary.json`, each puzzle's `intro`/`goal`/`reveal` in `src/data/puzzles/`, and
the concept list `CONCEPT_TAGS` in `src/validation/rules.ts`.
