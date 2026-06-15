# Categorium — Curriculum Roadmap

> Where the platform is headed, and a worked example of the kind of "complex logic" the engine
> is built to express and validate. This is a design North Star — see `SPEC.md` for the
> implementation contract and `PUZZLES.md` for authored content.

Categorium teaches category theory through transformation puzzles: players build and reason
about systems of typed processes, and the formal vocabulary is revealed concept-by-concept.
The hidden curriculum climbs from "a process turns one thing into another" all the way to the
structural ideas (functors, universal constructions) that make category theory a language for
computation and mathematics.

---

## The arc, Chapter by Chapter

Each chapter introduces one idea, framed first in metaphor and only later in formal terms. A
chapter unlocks when the previous one is complete.

### Chapter 1 — The Shape of Transformation  ✅ *authored — toolkit pilot*
`chapter-01-transformations`

Object, morphism, typed transformation, composition, identity, commutative diagram. The
category **laws** are *implied through play* here, not yet stated.

> **Toolkit mechanic (pilot).** To move past "connect the dots," Chapter 1 now pins only the
> start/goal objects and puts the candidate objects *and* machines in a side tray; the player
> chooses *which* pieces to bring onto the board and *how* to route them, leaving distractors
> behind (see the `toolkit` field in `SPEC.md`/`PUZZLES.md`). It's additive and reuses the whole
> wiring/validation stack. **Next decision:** whether to propagate toolkit mode to the other
> transformation chapters (2–5, 8) after playing Chapter 1.

| Concept | Formal reveal | Engine support |
|---|---|---|
| object / morphism | `f : A → B` | objects, morphisms |
| typed transform | matching ports | `type-valid-wiring` |
| composition | `g ∘ f : A → C` | `tracePath`, `concept-tag-required` |
| identity | `id_A : A → A` | self-loop morphism |
| commutative diagram | `g ∘ f = k ∘ h` | `path-equivalence` |

### Chapter 2 — The Laws of Composition  ✅ *authored*
`chapter-02-laws`

The laws Chapter 1 only hinted at, now made explicit and *demonstrated by construction*:

- **Identity law** — `f ∘ id_A = f` and `id_B ∘ f = f`. Inserting a do-nothing step changes
  nothing.
- **Associativity law** — `(h ∘ g) ∘ f = h ∘ (g ∘ f)`. How you *group* a chain of steps doesn't
  change the result.

Engine support: both ride on the existing `path-equivalence` rule — **no validator change**.
Associativity is made tangible with *composite machines* (a machine that bundles `g ∘ f`), so
the grouping choice becomes a visible wiring choice (see `PUZZLES.md`).

### Chapter 3 — Isomorphisms  ✅ *authored*
`chapter-03-isomorphisms`

When two objects are "the same" for all practical purposes: a morphism `f : A → B` with an
inverse `g : B → A` such that `g ∘ f = id_A` and `f ∘ g = id_B`. Reversible processes;
lossless round-trips. Built engine-light: round-trips are declared `path-equivalence`s to
identity paths, and the correct inverse is pinned with `allowed-morphisms-only` / types.

### Chapter 4 — Functors  ✅ *authored*
`chapter-04-functors`

A structure-preserving map *between two categories*: objects→objects, morphisms→morphisms,
preserving sources, targets, identities, and composition. The first genuinely "meta" idea —
taught here as **lifting**.

Engine support: **none required** — Chapter 4 is built from the existing behavior runtime. A
functor `F` (a Batch/List world) lifts each machine into a boxed world: `F(f) : F(A) → F(B)`
does the same job inside the box. The three puzzles are ordinary behavior puzzles (`samples` +
machine `action` tables + `required-output`), so the laws are *felt on real values* —
`F(id) = id` (P16) and `F(g∘f) = F(g)∘F(f)` (P15) — and an **impostor lift** (same boxed type,
wrong behavior) is told apart only by running it. The plain-world pipeline the functor transports
is shown read-only beside the boxed board via the puzzle's `referenceDiagram`. (The old
chip-mapping **FunctorCanvas** / `validateFunctor` puzzle kind was retired in this rework;
`src/domain/functor.ts` lives on for Chapter 6.)

### Chapter 5 — Products & Coproducts  ✅ *authored*
`chapter-05-products`

Products bundle two things (projections `π₁,π₂`, a unique pairing `⟨f,g⟩`); coproducts let you
choose one (injections `ι₁,ι₂`, a unique case-split `[f,g]`). Built engine-light via the
**universal-property** model — projections/injections and the pairing/case-split are all
*unary* morphisms, and the laws (`π₁∘⟨f,g⟩ = f`) are `path-equivalence`s. No multi-input
morphisms required.

### Chapter 6 — Natural Transformations  ✅ *authored*
`chapter-06-natural-transformations`

A map *between two functors* `F, G : C → D`: a component `α_A : F(A) → G(A)` at every object,
with every naturality square commuting (`α_B ∘ F(f) = G(f) ∘ α_A`).

Engine support: **the second real extension** — `src/domain/naturalTransformation.ts` gives the
target category D an author-declared **composition table** and checks naturality *genuinely*
(it computes both composites around each square and compares), so a correctly-typed but
non-natural family really fails. The UI is `NaturalTransformationCanvas` (components drawn from
C-objects to candidate D-morphisms). Anchored on `safeHead : List ⇒ Optional`.

## Chapters 7–11 — the advanced arc  *(planned)*

Five more chapters take a player who started by wiring a CSV parser into the deep end of category
theory. They are **numbered in build order**, chosen so the chapters that reuse the existing engine
(behaviour runtime, the natural-transformation board) come first, and the two that need a new
"bijection-matching" board come last (one mechanic serves both). Each unlocks the next, as today.

### Chapter 7 — Monads  *(behaviour runtime; lowest risk, highest payoff)*
`chapter-07-monads` · concepts: `monad`, `return` (unit), `bind`
A monad wraps a functor (Chapter 4) with two operations — `return` (put a value in the box) and
`bind`/`join` (chain a step that itself returns a box, flattening the result) — obeying identity
and associativity laws (the Chapter 2 template). The running example is **Optional/Maybe**:
chaining lookups that might fail, where one failure short-circuits the whole pipeline.
Puzzles: *Wrap It* (return), *Flatten the Nesting* (join, faithful vs lossy), *Chain with Bind*
(compose `A→T(B)` then `B→T(C)`, short-circuiting on nothing), *The Lookup Chain* (capstone — a
multi-step effectful pipeline with impostors). Engine: reuses the behaviour runtime with boxed
values and `action` tables; laws ride the existing `path-equivalence` rule. **No new engine.**

### Chapter 8 — Universal Properties & Limits  *(reuses standard board)*
`chapter-08-limits` · concepts: `terminal`, `equalizer`, `pullback`, `limit`
Generalises Chapter 5's products to **limits** — the "best object completing a shape", pinned down
by a unique mediating morphism. Terminal object (one arrow in from everything), equalizer (the
sub-object where two arrows agree), pullback ("join two tables on a key").
Puzzles: *The One-Arrow Object* (terminal), *Where They Agree* (equalizer + inclusion), *Join on a
Key* (pullback — build the unique mediating map), capstone. Engine: reuses `type-valid-wiring`,
`required-output`, and `path-equivalence` (the cone/square must commute). **No new engine.**

### Chapter 9 — Composing Transformations  *(reuses the NT board)*
`chapter-09-functor-categories` · concepts: `vertical-composition`, `functor-category`
Natural transformations themselves compose: vertical composition `β·α : F⇒H`, the identity
transformation `id_F`, and the reveal that functors + natural transformations form a category
`[C, D]`. Puzzles: *Stack Two* (build the composite componentwise), *The Do-Nothing Transformation*
(`α · id_F = α`), *The Functor Category* (associativity / interchange). Engine: reuses the
natural-transformation board + composition table; adds a vertical-composition check.

### Chapter 10 — Adjunctions  *(new "bijection-matching" board)*
`chapter-10-adjunctions` · concepts: `adjunction`, `unit`, `counit`
The central organising idea: `F ⊣ G` with a natural bijection `Hom(F A, B) ≅ Hom(A, G B)`, the
unit `η : 1⇒GF`, the counit `ε : FG⇒1`, and the triangle identities. Free ⊣ forgetful (List is the
free monoid). Puzzles: *Two Ways to Say It* (match corresponding arrows across the bijection),
*Unit & Counit*, *The Triangle Identities*. Engine: a new lightweight board where the player pairs
arrows on the left with arrows on the right — **the one new mechanic**, shared with Chapter 11.

### Chapter 11 — Yoneda & Representables  *(the capstone)*
`chapter-11-yoneda` · concepts: `representable`, `yoneda`
The iconic finale: an object is completely determined by the maps into it — `Hom(−, A)` — and the
Yoneda lemma `Nat(Hom(−,A), F) ≅ F(A)`. Ties back to Chapter 3 (same arrows ⟹ isomorphic).
Puzzles: *Known by Its Arrows* (match each object to its incoming-arrow fingerprint `Hom(−, X)`,
with an impossible-in-a-ranking distractor) and *The Yoneda Lemma* (match representable / lemma /
embedding to their precise statements, leaving the "all objects are equal" misconception unpaired).
Engine: reuses the bijection-matching board from Chapter 10.

| Ch | Concept | Reuses | New engine | Status |
|---|---|---|---|---|
| 7 | monads | behaviour runtime + `path-equivalence` | none | ✅ done |
| 8 | limits | standard board + `required-output` | none | ✅ done |
| 9 | functor categories | NT board + composition table | (authored composite tables) | ✅ done |
| 10 | adjunctions | new matching board | bijection-matching board ✅ | ✅ done |
| 11 | Yoneda | bijection-matching board | none | ✅ done |

Each new glossary term also gets two theme-aware Quiz questions, keeping the "2 per term" contract.

---

## Worked example — "The Refinery Floor"

A concrete, **engine-faithful** example of the complexity the platform targets. Everything
below is expressible in today's domain model and checkable by today's `validatePuzzle` — it
combines composition, identity, two commutative relations, and a composed shortcut in one
diagram. (Shown in Data Refinery vocabulary; the same structure skins to every theme.)

### Objects
```
A  Raw CSV        B  Clean Table     C  Chart
D  Report         E  Dashboard
```

### Morphisms
```
f  : A → B   Parser            id_B : B → B   Pass Through
g  : B → C   Charter           h    : B → D   Summarizer
k  : C → E   Plotter           m    : D → E   Compiler
s  : A → E   Express  (a single machine that does the whole pipeline)
```

### The diagram (two squares sharing the B→E diagonal, plus a shortcut)
```
        f            g            k
   A ───────▶ B ───────▶ C ───────▶ E
   │          │ ⟲ id_B              ▲
   │ s        │ h                m  │
   │          ▼                     │
   └────────▶ ... D ────────────────┘
   (s: the express route A ───────────────▶ E)
```

### What it asserts (the "complex logic")
1. **Commutative square** — `k ∘ g = m ∘ h` as morphisms `B → E`: charting-then-plotting equals
   summarizing-then-compiling. Two honest routes, same dashboard.
2. **Identity law** — `g ∘ id_B = g`: the Pass-Through loop on `B` can sit anywhere in a route
   without changing it.
3. **Composed shortcut** — `s = k ∘ g ∘ f` as morphisms `A → E`: the Express machine is exactly
   the full pipeline bundled into one.

### As engine data (sketch)
```ts
const diagram: Diagram = {
  objects:   [A, B, C, D, E],
  morphisms: [f, g, k, h, m, id_B, s],
  paths: [
    { id: 'top',      morphismIds: ['g', 'k'] },        // B → C → E
    { id: 'bottom',   morphismIds: ['h', 'm'] },        // B → D → E
    { id: 'long',     morphismIds: ['f', 'g', 'k'] },   // A → B → C → E
    { id: 'express',  morphismIds: ['s'] },             // A → E
    { id: 'loop-top', morphismIds: ['id_B', 'g', 'k'] } // B → B → C → E
  ],
};

const validation: PuzzleValidationRule[] = [
  { type: 'type-valid-wiring' },
  { type: 'required-final-object', objectId: 'E' },
  { type: 'path-equivalence', leftPathId: 'top',  rightPathId: 'bottom'  }, // commutative square
  { type: 'path-equivalence', leftPathId: 'long', rightPathId: 'express' }, // composed shortcut
  { type: 'path-equivalence', leftPathId: 'top',  rightPathId: 'loop-top' } // identity law
];
```

`validatePuzzle` confirms every wire is well-typed, the constructed route reaches `E`, and each
declared pair of routes is parallel (same source and target) — the structural backbone of "these
paths commute." It deliberately does **not** try to *prove* deep equality (see
`src/domain/equivalence.ts`); equivalence is author-declared and the engine checks the necessary
conditions. That boundary is what keeps the platform honest: it teaches true statements and
shows their shape, without pretending to be a theorem prover.

---

## Engine extension map

| Milestone | Concept | Engine work | Status |
|---|---|---|---|
| Ch 2 | identity & associativity laws | reuse `path-equivalence` + composite machines | ✅ done |
| Ch 3 | isomorphisms | round-trip via identity paths + `path-equivalence` | ✅ done |
| Ch 4 | functors | reworked as **lifting** — behavior runtime + `referenceDiagram`; no new engine | ✅ done |
| Ch 5 | products / coproducts | **none** — universal-property model with unary morphisms | ✅ done |
| Ch 6 | natural transformations | composition table on D (`domain/naturalTransformation.ts`) + `NaturalTransformationCanvas`; genuine naturality check | ✅ done |
| Ch 1 | behavior runtime | value evaluator (`domain/evaluate.ts`) + `required-output` rule + predict-then-run; equivalence checked on real values | ✅ done (pilot) |
| Ch 2,3,5 | behavior runtime rollout | the wiring chapters rebuilt around behavior with type-valid distractors | ✅ done |
| Ch 4 | functors as lifting | chip-mapping retired; laws felt on values (`F(id)=id`, `F(g∘f)=F(g)∘F(f)`); impostor lifts | ✅ done |
| Future | composing natural transformations | the functor-category algebra (vertical/horizontal composition, id_F) | 🔒 |
| Future | products-as-limits | multi-input/output morphisms (extension point already marked) | 🔒 |

## Non-curriculum roadmap (product)

Tracked in `README.md` "Next steps"; summarized here for completeness: per-puzzle e2e coverage,
keyboard/a11y graph construction (incl. the NT canvas), and a locked-puzzle deep-link screen.
(Sample-value animation and the `?debug=true` panel are now built.)
