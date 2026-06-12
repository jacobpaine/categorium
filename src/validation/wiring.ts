/**
 * Type-checks the wires in a constructed graph. A wire carries a value of some object/type out
 * of its source port and into its target port; the wire is well-typed iff those types match.
 *
 * Port types:
 *   - object node O : output type = input type = O.objectId (the thing itself)
 *   - morphism M    : input type = M.sourceObjectId, output type = M.targetObjectId
 *
 * This is how "not every process connects to every thing" becomes a real, checkable rule
 * (puzzle 2) and how the identity step is the only valid do-nothing wire (puzzle 4).
 */
import type { Diagram, PuzzleGraph, GraphNode } from '../domain';
import { getMorphism, getObject } from '../domain';

export type WireTypeError = { edgeId: string; message: string };

/** Type flowing OUT of a node's output port, or undefined if it can't be determined. */
function outputType(diagram: Diagram, node: GraphNode): string | undefined {
  if (node.kind === 'object') return node.objectId;
  return getMorphism(diagram, node.morphismId)?.targetObjectId;
}

/** Type expected INTO a node's input port, or undefined if it can't be determined. */
function inputType(diagram: Diagram, node: GraphNode): string | undefined {
  if (node.kind === 'object') return node.objectId;
  return getMorphism(diagram, node.morphismId)?.sourceObjectId;
}

function typeName(diagram: Diagram, objectId: string): string {
  const o = getObject(diagram, objectId);
  return o?.formalLabel ?? objectId;
}

export function wireTypeErrors(diagram: Diagram, graph: PuzzleGraph): WireTypeError[] {
  const byId = new Map(graph.nodes.map((n) => [n.nodeId, n]));
  const errors: WireTypeError[] = [];

  for (const edge of graph.edges) {
    const source = byId.get(edge.sourceNodeId);
    const target = byId.get(edge.targetNodeId);
    if (!source || !target) {
      errors.push({ edgeId: edge.id, message: 'A wire connects to a missing node.' });
      continue;
    }

    // A wire must pass through a machine; thing-to-thing wires carry no process.
    if (source.kind === 'object' && target.kind === 'object') {
      errors.push({
        edgeId: edge.id,
        message: 'A wire must pass through a machine — two things cannot connect directly.',
      });
      continue;
    }

    const out = outputType(diagram, source);
    const inn = inputType(diagram, target);
    if (out === undefined || inn === undefined) {
      errors.push({ edgeId: edge.id, message: 'A wire connects to an unknown machine.' });
      continue;
    }
    if (out !== inn) {
      errors.push({
        edgeId: edge.id,
        message:
          `This wire carries a '${typeName(diagram, out)}' into a port that expects ` +
          `'${typeName(diagram, inn)}'. The types don’t match, so the connection isn’t valid.`,
      });
    }
  }

  return errors;
}
