/**
 * NotationBox — a panel pinned to the bottom of the board that shows the category-theory notation
 * for what the player is doing: select an object and it populates; wire an arrow (or a chain) and it
 * shows the interaction, e.g. `g ∘ f : A → C`, in formal symbols and theme language. Hovering a line
 * reveals how to SAY it aloud ("g after f, from A to C"), so the player learns to write, read, and
 * pronounce the notation for the example they built.
 */
import { Sigma, Volume2 } from 'lucide-react';
import type { NotationLine } from './notation';

export function NotationBox({ lines }: { lines: NotationLine[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
      {/* pointer-events-auto so the lines are hoverable; only this compact card catches events. */}
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <Sigma className="h-3.5 w-3.5" aria-hidden /> Notation
          {lines.length > 0 && <span className="font-normal lowercase tracking-normal">· hover a line to say it aloud</span>}
        </div>
        {lines.length === 0 ? (
          <p className="mt-1 text-xs text-slate-400">
            Select an object, or wire an arrow between objects, to see how it's written.
          </p>
        ) : (
          <div className="mt-1 space-y-1.5">
            {lines.map((line, i) => (
              <div key={i} className="group relative flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                  {line.caption}
                </span>
                <code className="font-mono text-sm font-semibold text-slate-800">{line.formal}</code>
                <span className="text-xs text-slate-400">{line.themed}</span>
                <Volume2 className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-sky-500" aria-hidden />

                {/* Spoken form, revealed on hover. */}
                <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 hidden w-full max-w-md group-hover:block">
                  <div className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-lg">
                    <span className="mr-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                      <Volume2 className="h-3 w-3" aria-hidden /> Say it
                    </span>
                    {line.spoken}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
