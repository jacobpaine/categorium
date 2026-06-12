/**
 * The sample-value runtime. Pure domain logic.
 *
 * A machine (morphism) declares its BEHAVIOR as an action table: input sample-value id → output
 * sample-value id. Running a chain folds a value through each machine's table. A missing entry
 * means the machine JAMS on that input — it can't process that value (e.g. a wrong-typed value, or
 * a value the author didn't define behavior for). This is what makes two same-typed machines
 * distinguishable: they do different things to the same value.
 */
import type { Diagram, Result } from './types';
import { getMorphism } from './compose';

/** Run one machine on a value, or jam. */
export function runMorphism(diagram: Diagram, morphismId: string, valueId: string): Result<string> {
  const m = getMorphism(diagram, morphismId);
  if (!m) return { ok: false, error: `Unknown machine '${morphismId}'` };
  const out = m.action?.[valueId];
  if (out === undefined) {
    return { ok: false, error: `${m.formalLabel ?? m.id} can't process that input` };
  }
  return { ok: true, value: out };
}

/**
 * Run a value through a chain of machines, in order. Returns the final value, or the jam error at
 * the first machine that can't process what reaches it.
 */
export function runChain(
  diagram: Diagram,
  morphismIds: string[],
  inputValueId: string,
): Result<string> {
  let current = inputValueId;
  for (const id of morphismIds) {
    const step = runMorphism(diagram, id, current);
    if (!step.ok) return step;
    current = step.value;
  }
  return { ok: true, value: current };
}

/**
 * Run a value through a chain and return the value at every step (including the input), for the
 * sample-flow animation. Stops at a jam, marking the last reached value.
 */
export function traceValues(
  diagram: Diagram,
  morphismIds: string[],
  inputValueId: string,
): { values: string[]; jammedAt: number | null } {
  const values = [inputValueId];
  let current = inputValueId;
  for (let i = 0; i < morphismIds.length; i++) {
    const step = runMorphism(diagram, morphismIds[i], current);
    if (!step.ok) return { values, jammedAt: i };
    current = step.value;
    values.push(current);
  }
  return { values, jammedAt: null };
}
