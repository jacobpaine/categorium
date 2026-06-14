/**
 * Notation derivation for the live notation box. Turns the player's current selection and the
 * path they've wired into category-theory notation — the formal form (`g ∘ f : A → C`), the
 * themed form (`Charter ∘ Parser : Raw CSV → Chart`), and a SPOKEN form ("g after f, from A to C")
 * so the player learns how to *write* AND *say* what they're building. Pure: depends only on the
 * domain diagram + graph, never on React Flow.
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
  /** How to say it aloud, e.g. "g after f, from A to C". */
  spoken: string;
};

const objFormal = (d: Diagram, id: string) => getObject(d, id)?.formalLabel ?? id;
const objThemed = (d: Diagram, id: string, t: ThemeId) => getObject(d, id)?.labels[t] ?? id;
const morFormal = (d: Diagram, id: string) => getMorphism(d, id)?.formalLabel ?? id;
const morThemed = (d: Diagram, id: string, t: ThemeId) => getMorphism(d, id)?.labels[t] ?? id;

const GREEK: Record<string, string> = {
  α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon', η: 'eta', θ: 'theta',
  λ: 'lambda', μ: 'mu', π: 'pi', σ: 'sigma', τ: 'tau', φ: 'phi',
  Δ: 'Delta', Σ: 'Sigma', Π: 'Pi', Λ: 'Lambda',
};
const SUB: Record<string, string> = { '₀': '-zero', '₁': '-one', '₂': '-two', '₃': '-three' };

/** Pronounce a single object/morphism label: turn the symbols into words. */
export function sayLabel(s: string): string {
  let r = s;
  r = r.replace(/id_([A-Za-z0-9]+)/g, 'the identity on $1');
  r = r.replace(/([A-Za-z])\(([^)]+)\)/g, '$1 of $2'); // F(f) → F of f, T(A) → T of A
  r = r.replace(/⟨([^⟩]+)⟩/g, 'the pairing of $1'); // ⟨f,g⟩
  r = r.replace(/\[([^\]]+)\]/g, 'the case-split of $1'); // [f,g]
  for (const [k, v] of Object.entries(GREEK)) r = r.split(k).join(v);
  for (const [k, v] of Object.entries(SUB)) r = r.split(k).join(v);
  r = r.replace(/_([A-Za-z0-9]+)/g, '-$1'); // α_A → alpha-A
  r = r.split('∘').join(' after ');
  r = r.split('×').join(' cross ');
  r = r.split('+').join(' plus ');
  r = r.split('⇒').join(' to ');
  r = r.split('→').join(' to ');
  r = r.split('≅').join(' is isomorphic to ');
  r = r.replace(/!\??/g, 'the unique map');
  r = r.replace(/∅/g, 'nothing');
  r = r.replace(/\s+/g, ' ').trim();
  return r;
}

function objectLine(diagram: Diagram, objectId: string, theme: ThemeId): NotationLine {
  const formal = objFormal(diagram, objectId);
  return {
    caption: 'Selected object',
    formal,
    themed: objThemed(diagram, objectId, theme),
    spoken: `“${sayLabel(formal)}” — an object (a type/thing).`,
  };
}

function morphismLine(diagram: Diagram, morphismId: string, theme: ThemeId): NotationLine | null {
  const m = getMorphism(diagram, morphismId);
  if (!m) return null;
  const name = sayLabel(morFormal(diagram, m.id));
  const src = sayLabel(objFormal(diagram, m.sourceObjectId));
  const tgt = sayLabel(objFormal(diagram, m.targetObjectId));
  return {
    caption: 'Selected arrow',
    formal: `${morFormal(diagram, m.id)} : ${objFormal(diagram, m.sourceObjectId)} → ${objFormal(diagram, m.targetObjectId)}`,
    themed: `${morThemed(diagram, m.id, theme)} : ${objThemed(diagram, m.sourceObjectId, theme)} → ${objThemed(diagram, m.targetObjectId, theme)}`,
    spoken: `“${name}, from ${src} to ${tgt}” — a morphism (a process) from ${src} to ${tgt}.`,
  };
}

function pathLine(diagram: Diagram, graph: PuzzleGraph, theme: ThemeId): NotationLine | null {
  const traced = tracePath(diagram, graph);
  if (!traced.ok || traced.value.morphismIds.length === 0) return null;
  const { morphismIds, startObjectId, finalObjectId } = traced.value;
  const formalChain = [...morphismIds].reverse().map((id) => morFormal(diagram, id)).join(' ∘ ');
  const themedChain = [...morphismIds].reverse().map((id) => morThemed(diagram, id, theme)).join(' ∘ ');
  const endpoints = (a: string, b: string) => ` : ${a} → ${b}`;
  const multi = morphismIds.length > 1;

  const spokenChain = [...morphismIds].reverse().map((id) => sayLabel(morFormal(diagram, id))).join(' after ');
  const start = sayLabel(objFormal(diagram, startObjectId));
  const end = sayLabel(objFormal(diagram, finalObjectId));
  const firstName = sayLabel(morFormal(diagram, morphismIds[0]));
  const spoken = multi
    ? `“${spokenChain}, from ${start} to ${end}.” The ∘ is read “after” — do ${firstName} first, then the rest, right to left.`
    : `“${spokenChain}, from ${start} to ${end}” — a morphism from ${start} to ${end}.`;

  return {
    caption: multi ? 'Path so far' : 'Arrow so far',
    formal: formalChain + endpoints(objFormal(diagram, startObjectId), objFormal(diagram, finalObjectId)) + (multi ? '  (a composite)' : ''),
    themed: themedChain + endpoints(objThemed(diagram, startObjectId, theme), objThemed(diagram, finalObjectId, theme)),
    spoken,
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

  const path = pathLine(diagram, graph, theme);
  if (path) lines.push(path);

  if (selectedNodeIds.length === 1) {
    const node = graph.nodes.find((n) => n.nodeId === selectedNodeIds[0]);
    if (node?.kind === 'object') lines.push(objectLine(diagram, node.objectId, theme));
    else if (node?.kind === 'morphism') {
      const ml = morphismLine(diagram, node.morphismId, theme);
      if (ml && !(path && lines.length === 1 && path.formal.startsWith(ml.formal))) lines.push(ml);
    }
  }

  return lines;
}
