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

## Chapter 3 teaching order — "Sameness, Both Ways" (isomorphisms)
1. Build the inverse — `g ∘ f = id_A` (a round trip that returns home).
2. The other way — `f ∘ g = id_B`; with both, f is an isomorphism, `A ≅ B`.
3. Choose the true inverse — only a morphism that returns to the start can be an inverse.
4. Isos compose — `A ≅ B ≅ C ⟹ A ≅ C`. Be honest: inverses are author-declared, not value-checked.

## Chapter 4 teaching order — "Maps Between Worlds" (functors)
A functor is a NEW puzzle kind (`kind: "functor"`): the player maps a whole source category onto
a target one (objects→objects, morphisms→morphisms) on the `FunctorCanvas`.
1. Map the arrow — a functor sends `f : A→B` to `F(f) : F(A)→F(B)` (e.g. the List functor).
2. Preserve composition — `F(g∘f) = F(g)∘F(f)`.
3. Respect every arrow — object and morphism maps must agree; many functors can exist (List vs Optional).
The engine enforces totality + source/target preservation; identity/composition preservation is
the stated law (a mis-pointed image fails). See `src/domain/functor.ts`.

## Chapter 5 teaching order — "Combining and Choosing" (products & coproducts)
Use the **universal-property** model (unary morphisms only — no multi-input morphisms):
1. Project out — a product `A×B` has projections `π₁, π₂`.
2. Pair it up — the unique pairing `⟨f,g⟩` with `π₁∘⟨f,g⟩ = f`, `π₂∘⟨f,g⟩ = g`.
3. Either way — the coproduct is the dual: injections `ι₁, ι₂` and a unique case-split `[f,g]`.
4. Make a copy — the diagonal `Δ = ⟨id, id⟩`. Products = "and", coproducts = "or".

## Chapter 6 teaching order — "Between the Maps" (natural transformations)
A natural transformation is a NEW puzzle kind (`kind: "natural-transformation"`): given two
functors F, G : C → D, the player chooses a component `α_A : F(A) → G(A)` at each object of C.
1. Build a transformation — a family of components, one per object (`safeHead : List ⇒ Optional`).
2. Make the square commute — naturality (`α_B ∘ F(f) = G(f) ∘ α_A`); correct typing isn't enough.
3. The identity transformation — `id_F : F ⇒ F`; the identity morphism of the functor category `[C,D]`.
Unique to this chapter: naturality is checked **genuinely** against D's author-declared
composition table (the engine computes both composites and compares) — so a typed-but-non-natural
family really fails. Say so; it's a step up from declared commutativity. See
`src/domain/naturalTransformation.ts`.

## Curriculum arc beyond Chapter 6
See `ROADMAP.md`: composing natural transformations (the functor-category algebra) and
products-as-limits (needs multi-input morphisms). Keep new chapters honest about what the engine
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
