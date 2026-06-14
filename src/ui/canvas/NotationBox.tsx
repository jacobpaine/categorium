/**
 * NotationBox — a panel pinned to the bottom of the board that shows the category-theory notation
 * for what the player is doing: select an object and it populates; wire an arrow (or a chain) and it
 * shows the interaction, e.g. `g ∘ f : A → C`, in both formal symbols and theme language. It's a
 * read-only teaching aid so the player learns to *write* the notation for the example they built.
 */
import { Sigma } from 'lucide-react';
import type { NotationLine } from './notation';

export function NotationBox({ lines }: { lines: NotationLine[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <Sigma className="h-3.5 w-3.5" aria-hidden /> Notation
        </div>
        {lines.length === 0 ? (
          <p className="mt-1 text-xs text-slate-400">
            Select an object, or wire an arrow between objects, to see how it's written.
          </p>
        ) : (
          <div className="mt-1 space-y-1.5">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                  {line.caption}
                </span>
                <code className="font-mono text-sm font-semibold text-slate-800">{line.formal}</code>
                <span className="text-xs text-slate-400">{line.themed}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
