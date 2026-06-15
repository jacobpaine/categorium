/**
 * React Flow adapter — the ONLY module that knows both the domain `PuzzleGraph` and React
 * Flow's node/edge shapes. This preserves the rule that `src/domain` and `src/validation`
 * never import `reactflow`.
 *
 *   toReactFlow(graph, diagram, opts) : domain graph -> RF nodes/edges (for rendering)
 *   fromReactFlow(nodes, edges)       : RF nodes/edges -> domain graph (for validation/saving)
 *
 * Node mapping: object node -> 'objectTerminal' node, morphism node -> 'machine' node.
 * Edge mapping: GraphEdge -> Wire.
 */
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { Diagram, PuzzleGraph, GraphNode, ThemeId } from '../domain';
import { getObject, getMorphism } from '../domain';

export const OBJECT_NODE_TYPE = 'objectTerminal';
export const MACHINE_NODE_TYPE = 'machine';

export type ObjectNodeData = {
  objectId: string;
  /** Theme display label. */
  label: string;
  formalLabel?: string;
  description?: string;
  role?: 'start' | 'goal';
  colorToken?: string;
  /** Whether to surface the formal label (concept unlocked). */
  showFormal: boolean;
  /** Toolkit mode: this node was placed from the tray and can be sent back. Display-only. */
  removable?: boolean;
  /** Toolkit mode: send this placed node back to the tray. Display-only (not serialized). */
  onRemove?: () => void;
};

export type MachineNodeData = {
  morphismId: string;
  label: string;
  formalLabel?: string;
  description?: string;
  sourceObjectId: string;
  targetObjectId: string;
  /** Formal labels of the endpoints (e.g. 'A', 'B'), for the hover-card type signature. */
  sourceFormal?: string;
  targetFormal?: string;
  /** Theme labels of the endpoints, used when no formal label exists. */
  sourceLabel?: string;
  targetLabel?: string;
  /** Color tokens of the input/output object types, for port coloring. */
  inputColorToken?: string;
  outputColorToken?: string;
  showFormal: boolean;
  /** Toolkit mode: this node was placed from the tray and can be sent back. Display-only. */
  removable?: boolean;
  /** Toolkit mode: send this placed node back to the tray. Display-only (not serialized). */
  onRemove?: () => void;
};

export type ObjectNode = Node<ObjectNodeData, typeof OBJECT_NODE_TYPE>;
export type MachineNode = Node<MachineNodeData, typeof MACHINE_NODE_TYPE>;
export type RFNode = ObjectNode | MachineNode;

export type ToReactFlowOptions = {
  theme: ThemeId;
  /** Concepts the player has unlocked, controlling formal-label visibility. */
  showFormalLabels?: boolean;
  /** Animate wires (after a successful Run). */
  animated?: boolean;
};

/** Fallback layout when an authored node carries no position. */
function fallbackPosition(node: GraphNode, index: number): { x: number; y: number } {
  return node.position ?? { x: 40 + index * 300, y: 140 };
}

/**
 * Build the React Flow node for an object placement. Shared by `toReactFlow` and the toolkit
 * click-to-place path, so a tray-placed object node is byte-identical to a pre-placed one.
 */
export function buildObjectNode(
  node: Extract<GraphNode, { kind: 'object' }>,
  diagram: Diagram,
  opts: ToReactFlowOptions,
  position: { x: number; y: number },
): ObjectNode {
  const obj = getObject(diagram, node.objectId);
  const data: ObjectNodeData = {
    objectId: node.objectId,
    label: obj?.labels[opts.theme] ?? node.objectId,
    formalLabel: obj?.formalLabel,
    description: obj?.description?.[opts.theme],
    role: node.role,
    colorToken: obj?.colorToken,
    showFormal: Boolean(opts.showFormalLabels),
  };
  return { id: node.nodeId, type: OBJECT_NODE_TYPE, position, data };
}

/** Build the React Flow node for a morphism placement. See `buildObjectNode`. */
export function buildMorphismNode(
  node: Extract<GraphNode, { kind: 'morphism' }>,
  diagram: Diagram,
  opts: ToReactFlowOptions,
  position: { x: number; y: number },
): MachineNode {
  const mor = getMorphism(diagram, node.morphismId);
  const inputObj = mor ? getObject(diagram, mor.sourceObjectId) : undefined;
  const outputObj = mor ? getObject(diagram, mor.targetObjectId) : undefined;
  const data: MachineNodeData = {
    morphismId: node.morphismId,
    label: mor?.labels[opts.theme] ?? node.morphismId,
    formalLabel: mor?.formalLabel,
    description: mor?.description?.[opts.theme],
    sourceObjectId: mor?.sourceObjectId ?? '',
    targetObjectId: mor?.targetObjectId ?? '',
    sourceFormal: inputObj?.formalLabel,
    targetFormal: outputObj?.formalLabel,
    sourceLabel: inputObj?.labels[opts.theme],
    targetLabel: outputObj?.labels[opts.theme],
    inputColorToken: inputObj?.colorToken,
    outputColorToken: outputObj?.colorToken,
    showFormal: Boolean(opts.showFormalLabels),
  };
  return { id: node.nodeId, type: MACHINE_NODE_TYPE, position, data };
}

export function toReactFlow(
  graph: PuzzleGraph,
  diagram: Diagram,
  opts: ToReactFlowOptions,
): { nodes: RFNode[]; edges: Edge[] } {
  const nodes: RFNode[] = graph.nodes.map((node, index) => {
    const position = fallbackPosition(node, index);
    return node.kind === 'object'
      ? buildObjectNode(node, diagram, opts, position)
      : buildMorphismNode(node, diagram, opts, position);
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: 'default',
    animated: Boolean(opts.animated),
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return { nodes, edges };
}

/**
 * Map React Flow nodes/edges back into a domain `PuzzleGraph`. Node kind is recovered from the
 * RF node `type`; positions are preserved so saved in-progress graphs keep their layout.
 */
export function fromReactFlow(nodes: RFNode[], edges: Edge[]): PuzzleGraph {
  const graphNodes: GraphNode[] = nodes.map((n) => {
    const position = { x: n.position.x, y: n.position.y };
    if (n.type === MACHINE_NODE_TYPE) {
      return {
        kind: 'morphism',
        nodeId: n.id,
        morphismId: (n.data as MachineNodeData).morphismId,
        position,
      };
    }
    const data = n.data as ObjectNodeData;
    return {
      kind: 'object',
      nodeId: n.id,
      objectId: data.objectId,
      ...(data.role ? { role: data.role } : {}),
      position,
    };
  });

  const graphEdges = edges.map((e) => ({
    id: e.id,
    sourceNodeId: e.source,
    targetNodeId: e.target,
  }));

  return { nodes: graphNodes, edges: graphEdges };
}
