/**
 * NodeHoverCard — an instant, styled tooltip shown when the player hovers a graph element.
 * It answers "what is this thing in the system?" with three lines: the element's name, its
 * formal role + label (e.g. `Object · A`, `Process · f`), an optional type signature, and a
 * one-line description. A generic role line is shown when no specific description is authored,
 * so the card is always informative.
 *
 * Pure CSS reveal: the parent node has `group relative`, this renders `hidden group-hover:block`
 * and is `pointer-events-none`, so it never interferes with dragging or wiring.
 */

const ROLE_LABEL = { object: 'Object', process: 'Process' } as const;
const ROLE_FALLBACK = {
  object: 'A thing you can transform.',
  process: 'A process from one thing to another.',
} as const;

export function NodeHoverCard({
  name,
  role,
  formalLabel,
  signature,
  description,
  placement = 'top',
}: {
  name: string;
  role: 'object' | 'process';
  formalLabel?: string;
  signature?: string;
  description?: string;
  /** Side of the node the card opens toward. Use 'bottom' for nodes pinned near the canvas top. */
  placement?: 'top' | 'bottom';
}) {
  const pos = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-50 hidden w-56 -translate-x-1/2 group-hover:block ${pos}`}
      role="tooltip"
    >
      {placement === 'bottom' && (
        <div className="mx-auto -mb-1 h-2 w-2 rotate-45 border-l border-t border-slate-200 bg-white" />
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-lg">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {ROLE_LABEL[role]}
            {formalLabel ? ` · ${formalLabel}` : ''}
          </span>
        </div>
        {signature && <div className="mt-0.5 font-mono text-xs text-slate-500">{signature}</div>}
        <p className="mt-1 text-xs text-slate-600">{description || ROLE_FALLBACK[role]}</p>
      </div>
      {placement === 'top' && (
        <div className="mx-auto -mt-1 h-2 w-2 rotate-45 border-b border-r border-slate-200 bg-white" />
      )}
    </div>
  );
}
