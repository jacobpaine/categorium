/**
 * React Flow adapter — STUB (next session).
 *
 * This is the ONLY place that knows about both the domain `PuzzleGraph` and React Flow's
 * node/edge shape. Keeping the mapping here preserves the rule that the domain stays
 * framework-independent. The next session implements:
 *
 *   toReactFlow(graph, diagram, theme): { nodes, edges }   // domain -> RF for rendering
 *   fromReactFlow(nodes, edges): PuzzleGraph               // RF -> domain for validation
 *
 * Node mapping: object node -> ObjectTerminal node, morphism node -> MachineNode.
 * Edge mapping: GraphEdge -> Wire, colored by the object/type where practical.
 */
import type { PuzzleGraph } from '../domain';

export type ReactFlowGraph = {
  // Typed as unknown[] until the next session pulls in reactflow's Node/Edge types, so the
  // domain build stays free of a React Flow dependency.
  nodes: unknown[];
  edges: unknown[];
};

// TODO(next-session): implement domain <-> React Flow mapping (see module comment).
export function toReactFlow(_graph: PuzzleGraph): ReactFlowGraph {
  throw new Error('React Flow adapter not implemented yet (next session).');
}
