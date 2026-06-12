---
name: react-flow-game-ui
description: Build Categorium's React Flow graph UI (machine nodes, object terminals, ports, wires) while keeping the adapter separate from domain graph logic. Use when working in src/flow or src/ui graph components.
---

# react-flow-game-ui

Builds the puzzle canvas and keeps the React Flow layer cleanly separated from the domain.

## Separation rule (non-negotiable)
`src/flow/adapter.ts` is the only module that knows both the domain `PuzzleGraph` and React
Flow's node/edge shapes:
- `toReactFlow(graph, diagram, theme)` → RF nodes/edges for rendering.
- `fromReactFlow(nodes, edges)` → domain `PuzzleGraph` for `validatePuzzle`.

Domain code (`src/domain`, `src/validation`) must never import `reactflow`. UI components use
game vocabulary (`MachineNode`, `ObjectTerminal`, `Wire`, `PuzzleCanvas`).

## Node & port conventions
- Object/type → `ObjectTerminal` (circular/pill), with Start/Goal badges from `role`.
- Morphism → `MachineNode` (rectangle), input port left, output port right.
- Ports colored/iconed by object/type. Invalid target ports warn on hover; tooltip shows the
  theme label, and the formal label once that concept is unlocked.

## Wires
Curved, directional arrowheads, colored by type where practical, animated only after Run.
Don't hard-block all invalid wires — early puzzles allow mistakes and explain them via
`validatePuzzle`'s first-failure message.

## Run / Check
Lightweight live hints for obvious issues; a manual **Run / Check** button drives final
`validatePuzzle`. Sample animation plays only after Run. Layout mode is author-controlled
(fixed for tutorials, freeform later).

## a11y / device
Mouse-first graph editing is acceptable for the MVP; add screen-reader labels on major
controls and leave TODOs for full keyboard graph construction. Desktop-first; keep panels
responsive.
