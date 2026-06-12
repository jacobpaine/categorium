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

## Chapter 2 teaching order — "The Laws of Composition" (now formally taught)
1. Identity law, right side — `f ∘ id_A = f` (insert a do-nothing step before a process).
2. Identity law, left side — `id_B ∘ f = f` (insert it after).
3. Identities anywhere — repeatedly inserting identities collapses to the clean chain.
4. Associativity — `(h ∘ g) ∘ f = h ∘ (g ∘ f)`; grouping a chain doesn't change the result.
   Taught with *composite machines* (a machine that bundles `g ∘ f`) so grouping is visible.

Together, the identity and associativity laws are *exactly* what make objects + morphisms a
**category** — state this in the associativity reveal. Keep both laws true and precise; the
engine declares the equalities (`path-equivalence`) rather than proving them.

## Curriculum arc beyond Chapter 2
See `ROADMAP.md`: Ch3 isomorphisms (inverses, round-trips), Ch4 functors (maps between
categories), then universal constructions. Keep new chapters honest about what the engine
checks vs. declares.

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
