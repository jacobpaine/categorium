/**
 * Matching validation — checks the player's left→right pairing against the reference solution.
 * Every left item must be matched, and matched to its correct right item.
 */
export type MatchingValidationResult =
  | { ok: true }
  | { ok: false; firstFailure: { message: string } };

export function validateMatching(
  solution: Record<string, string>,
  chosen: Record<string, string>,
  leftLabel?: (id: string) => string,
): MatchingValidationResult {
  for (const leftId of Object.keys(solution)) {
    const name = leftLabel?.(leftId) ?? leftId;
    if (chosen[leftId] === undefined) {
      return { ok: false, firstFailure: { message: `Match every item — “${name}” is still unpaired.` } };
    }
    if (chosen[leftId] !== solution[leftId]) {
      return { ok: false, firstFailure: { message: `That isn't the right match for “${name}”.` } };
    }
  }
  return { ok: true };
}
