/**
 * Derive which category-theory concepts a constructed graph actually demonstrates. Used by
 * the `concept-tag-required` rule so that requiring e.g. "composition" has real teeth (the
 * player must actually chain two machines), not just a declaration.
 */
import type { Diagram } from '../domain';
import { tracePath, morphismIdsUsed, getMorphism } from '../domain';
import type { PuzzleGraph } from '../domain';
import type { ConceptTag } from './rules';

export function conceptsExercised(diagram: Diagram, graph: PuzzleGraph): Set<ConceptTag> {
  const tags = new Set<ConceptTag>();

  const usedMorphismIds = morphismIdsUsed(graph);
  const hasObjects = graph.nodes.some((n) => n.kind === 'object');
  if (hasObjects) tags.add('object');

  if (usedMorphismIds.length > 0) {
    tags.add('morphism');
    // Any wired machine connects typed ports, so it demonstrates a typed transformation.
    tags.add('typed-transform');
  }

  // Identity: a used morphism whose source and target are the same object.
  for (const id of usedMorphismIds) {
    const m = getMorphism(diagram, id);
    if (m && m.sourceObjectId === m.targetObjectId) {
      tags.add('identity');
      break;
    }
  }

  // Composition: the traced linear path chains two or more morphisms.
  const traced = tracePath(diagram, graph);
  if (traced.ok && traced.value.morphismIds.length >= 2) {
    tags.add('composition');
  }

  // NOTE: 'commutative-diagram' is established by the path-equivalence rule (multi-path
  // tracing is a next-session concern), so it is intentionally not derived here.
  return tags;
}
