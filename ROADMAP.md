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

### Chapter 1 — The Shape of Transformation  ✅ *authored*
`chapter-01-transformations`

Object, morphism, typed transformation, composition, identity, commutative diagram. The
category **laws** are *implied through play* here, not yet stated.

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

### Chapter 3 — Isomorphisms  🔒 *placeholder*
`chapter-03-isomorphisms`

When two objects are "the same" for all practical purposes: a morphism `f : A → B` with an
inverse `g : B → A` such that `g ∘ f = id_A` and `f ∘ g = id_B`. Reversible processes;
lossless round-trips.

Engine support: round-trip equivalence — express `g ∘ f` and `id_A` as declared paths and check
them with `path-equivalence`. A puzzle asks the player to build *both directions* and show each
round-trip returns to the start. Small/no engine change (an identity path is a one-morphism
path of a self-loop).

### Chapter 4 — Functors  🔒 *placeholder*
`chapter-04-functors`

A structure-preserving map *between two categories*: it sends objects to objects and morphisms
to morphisms while preserving identities and composition (`F(id_A) = id_F(A)`,
`F(g ∘ f) = F(g) ∘ F(f)`). The first genuinely "meta" idea — a process that transforms whole
systems, not just things.

Engine support: **new** — the domain model is currently a single category. This needs a
two-category representation and "functor arrows" between them in the graph/adapter. Flagged as
the first substantial engine extension on the roadmap.

### Beyond — Universal constructions & natural transformations  🔒 *future*

Products & coproducts (`A × B`, `A + B`) as the formal version of "combine / choose"; natural
transformations as maps *between functors*. These are the eventual goal: by here, a player who
started by wiring a CSV parser is reasoning about universal properties. Requires multi-input /
multi-output morphisms (the domain model already marks this extension point in
`src/domain/types.ts`).

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

| Milestone | Concept | Engine work |
|---|---|---|
| Ch 2 | identity & associativity laws | **none** — reuse `path-equivalence` + composite machines |
| Ch 3 | isomorphisms | small — round-trip via identity paths + `path-equivalence` |
| Ch 4 | functors | **new** — two-category model + functor arrows in domain/adapter |
| Future | products / coproducts | **new** — multi-input/output morphisms (extension point already marked) |
| Future | sample-value semantics | optional — a value evaluator so equivalence can be *checked* on samples, not only declared |

## Non-curriculum roadmap (product)

Tracked in `README.md` "Next steps"; summarized here for completeness: sample-value animation,
the `?debug=true` panel, per-puzzle e2e coverage, keyboard/a11y graph construction, and a
locked-puzzle deep-link screen.
