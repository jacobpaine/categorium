/**
 * Notation derivation for the live notation box. Turns the player's current selection and the
 * path they've wired into category-theory notation — both the formal form (`g ∘ f : A → C`) and
 * the themed form (`Charter ∘ Parser : Raw CSV → Chart`) — so they can see how to *write* what
 * they're building. Pure: depends only on the domain diagram + graph, never on React Flow.
 */
import type { Diagram, PuzzleGraph, ThemeId } from '../../domain';
import { getObject, getMorphism, tracePath } from '../../domain';

export type NotationLine = {
  /** Short caption, e.g. "Selected object" or "Path so far". */
  caption: string;
  /** Formal notation, e.g. "g ∘ f : A → C". */
  formal: string;
  /** Theme-language notation, e.g. "Charter ∘ Parser : Raw CSV → Chart". */
  themed: string;
};

const objFormal = (d: Diagram, id: string) => getObject(d, id)?.formalLabel ?? id;
const objThemed = (d: Diagram, id: string, t: ThemeId) => getObject(d, id)?.labels[t] ?? id;
const morFormal = (d: Diagram, id: string) => getMorphism(d, id)?.formalLabel ?? id;
const morThemed = (d: Diagram, id: string, t: ThemeId) => getMorphism(d, id)?.labels[t] ?? id;

/** Notation for a single selected object node. */
function objectLine(diagram: Diagram, objectId: string, theme: ThemeId): NotationLine {
  return {
    caption: 'Selected object',
    formal: objFormal(diagram, objectId),
    themed: objThemed(diagram, objectId, theme),
  };
}

/** Notation for a single selected morphism node: `f : A → B`. */
function morphismLine(diagram: Diagram, morphismId: string, theme: ThemeId): NotationLine | null {
  const m = getMorphism(diagram, morphismId);
  if (!m) return null;
  return {
    caption: 'Selected arrow',
    formal: `${morFormal(diagram, m.id)} : ${objFormal(diagram, m.sourceObjectId)} → ${objFormal(diagram, m.targetObjectId)}`,
    themed: `${morThemed(diagram, m.id, theme)} : ${objThemed(diagram, m.sourceObjectId, theme)} → ${objThemed(diagram, m.targetObjectId, theme)}`,
  };
}

/**
 * Notation for the path the player has wired from the start, as a composite.
 * One arrow → `f : A → B`; several → `h ∘ g ∘ f : A → D` (right-to-left, as composition is read).
 */
function pathLine(diagram: Diagram, graph: PuzzleGraph, theme: ThemeId): NotationLine | null {
  const traced = tracePath(diagram, graph);
  if (!traced.ok || traced.value.morphismIds.length === 0) return null;
  const { morphismIds, startObjectId, finalObjectId } = traced.value;
  const formalChain = [...morphismIds].reverse().map((id) => morFormal(diagram, id)).join(' ∘ ');
  const themedChain = [...morphismIds].reverse().map((id) => morThemed(diagram, id, theme)).join(' ∘ ');
  const endpoints = (a: string, b: string) => ` : ${a} → ${b}`;
  const compose = morphismIds.length > 1 ? '  (a composite)' : '';
  return {
    caption: morphismIds.length > 1 ? 'Path so far' : 'Arrow so far',
    formal: formalChain + endpoints(objFormal(diagram, startObjectId), objFormal(diagram, finalObjectId)) + compose,
    themed: themedChain + endpoints(objThemed(diagram, startObjectId, theme), objThemed(diagram, finalObjectId, theme)),
  };
}

/**
 * Derive what the notation box should show. Prefers the path being constructed (the "interaction"),
 * and also reflects the current single-node selection. Returns up to two lines; empty when there's
 * nothing meaningful yet.
 */
export function deriveNotation(
  diagram: Diagram,
  graph: PuzzleGraph,
  selectedNodeIds: string[],
  theme: ThemeId,
): NotationLine[] {
  const lines: NotationLine[] = [];

  // The path the player has built (the interaction). Shown first — it's the headline.
  const path = pathLine(diagram, graph, theme);
  if (path) lines.push(path);

  // The current single selection, if it adds something not already shown.
  if (selectedNodeIds.length === 1) {
    const node = graph.nodes.find((n) => n.nodeId === selectedNodeIds[0]);
    if (node?.kind === 'object') lines.push(objectLine(diagram, node.objectId, theme));
    else if (node?.kind === 'morphism') {
      const ml = morphismLine(diagram, node.morphismId, theme);
      // Avoid duplicating a single-arrow path that's the same morphism.
      if (ml && !(path && lines.length === 1 && path.formal.startsWith(ml.formal))) lines.push(ml);
    }
  }

  return lines;
}
