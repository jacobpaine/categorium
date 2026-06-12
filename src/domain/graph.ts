/**
 * Framework-independent representation of a constructed puzzle graph (what the player builds,
 * and what `initialGraph` / `referenceSolution` describe in puzzle JSON). The React Flow
 * adapter (next session) maps this to/from RF nodes & edges; nothing here depends on React.
 *
 * Game/UI vocabulary mapping:
 *   object node   -> an ObjectTerminal (start / goal / intermediate "type")
 *   morphism node -> a MachineNode
 *   edge          -> a Wire
 */
import type { Diagram, Result } from './types';
import { getMorphism } from './compose';

export type GraphNode =
  | { kind: 'object'; nodeId: string; objectId: string; role?: 'start' | 'goal' }
  | { kind: 'morphism'; nodeId: string; morphismId: string };

export type GraphEdge = {
  id: string;
  /** Node the wire leaves (its output side). */
  sourceNodeId: string;
  /** Node the wire enters (its input side). */
  targetNodeId: string;
};

export type PuzzleGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/** A linear path traced through a constructed graph. */
export type TracedPath = {
  morphismIds: string[];
  startObjectId: string;
  finalObjectId: string;
};

function nodeById(graph: PuzzleGraph, id: string): GraphNode | undefined {
  return graph.nodes.find((n) => n.nodeId === id);
}

function outgoingFrom(graph: PuzzleGraph, nodeId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.sourceNodeId === nodeId);
}

function hasIncoming(graph: PuzzleGraph, nodeId: string): boolean {
  return graph.edges.some((e) => e.targetNodeId === nodeId);
}

/**
 * Trace the linear chain a player has wired, starting from the start object node.
 *
 * MVP scope: handles a single linear path (one outgoing wire per node). If a node branches,
 * the first outgoing wire is followed and the rest ignored — multi-path tracing (needed for
 * the commutative-diagram puzzle) is a next-session concern and should consume declared
 * `paths` rather than re-trace. Cycles are guarded against.
 */
export function tracePath(diagram: Diagram, graph: PuzzleGraph): Result<TracedPath> {
  const objectNodes = graph.nodes.filter((n) => n.kind === 'object');
  if (objectNodes.length === 0) {
    return { ok: false, error: 'Graph has no object nodes' };
  }

  const start =
    objectNodes.find((n) => n.kind === 'object' && n.role === 'start') ??
    objectNodes.find((n) => !hasIncoming(graph, n.nodeId));
  if (!start || start.kind !== 'object') {
    return { ok: false, error: 'Could not determine a start object node' };
  }

  const morphismIds: string[] = [];
  const visited = new Set<string>();
  let currentNodeId = start.nodeId;
  let finalObjectId = start.objectId;

  // Walk object -> morphism -> object ... until a node has no outgoing wire.
  // Bound the walk by the node count to defend against cycles.
  for (let step = 0; step <= graph.nodes.length; step++) {
    if (visited.has(currentNodeId)) {
      return { ok: false, error: 'Graph contains a cycle' };
    }
    visited.add(currentNodeId);

    const outgoing = outgoingFrom(graph, currentNodeId);
    if (outgoing.length === 0) break;

    const nextNode = nodeById(graph, outgoing[0].targetNodeId);
    if (!nextNode) {
      return { ok: false, error: `Wire points to unknown node '${outgoing[0].targetNodeId}'` };
    }

    if (nextNode.kind === 'morphism') {
      const m = getMorphism(diagram, nextNode.morphismId);
      if (!m) return { ok: false, error: `Unknown morphism '${nextNode.morphismId}'` };
      morphismIds.push(m.id);
    } else {
      finalObjectId = nextNode.objectId;
    }
    currentNodeId = nextNode.nodeId;
  }

  return {
    ok: true,
    value: { morphismIds, startObjectId: start.objectId, finalObjectId },
  };
}

/** All morphism ids referenced by morphism nodes in the graph. */
export function morphismIdsUsed(graph: PuzzleGraph): string[] {
  return graph.nodes
    .filter((n): n is Extract<GraphNode, { kind: 'morphism' }> => n.kind === 'morphism')
    .map((n) => n.morphismId);
}
