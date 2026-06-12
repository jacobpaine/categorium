/**
 * BehaviorPanel — the predict-then-run controls for behavior puzzles. Shows the concrete input
 * value and the goal value, lets the player predict what will come out (encouraged, not gated),
 * and after a Run reports what was actually produced and whether the prediction was right.
 */
import type { ReactNode } from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';
import type { SampleValue, ThemeId } from '../../domain';

function valueLabel(samples: SampleValue[], id: string, theme: ThemeId): string {
  return samples.find((s) => s.id === id)?.labels[theme] ?? id;
}

function Chip({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'rose' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    sky: 'bg-sky-100 text-sky-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    rose: 'bg-rose-100 text-rose-800',
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function BehaviorPanel({
  samples,
  theme,
  inputValueId,
  goalValueId,
  predictedId,
  onPredict,
  actualOutputId,
  ran,
  locked,
}: {
  samples: SampleValue[];
  theme: ThemeId;
  inputValueId: string;
  goalValueId: string;
  predictedId: string | null;
  onPredict: (id: string) => void;
  actualOutputId: string | null;
  ran: boolean;
  locked: boolean;
}) {
  const goalObjectId = samples.find((s) => s.id === goalValueId)?.objectId;
  const candidates = samples.filter((s) => s.objectId === goalObjectId);

  return (
    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex items-center gap-2">
        <Chip tone="sky">{valueLabel(samples, inputValueId, theme)}</Chip>
        <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
        <Chip tone="emerald">{valueLabel(samples, goalValueId, theme)}</Chip>
        <span className="text-[11px] text-slate-400">input → goal</span>
      </div>

      {!locked && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden /> What will come out?
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {candidates.map((s) => (
              <button
                key={s.id}
                onClick={() => onPredict(s.id)}
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  predictedId === s.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.labels[theme]}
              </button>
            ))}
          </div>
        </div>
      )}

      {ran && (
        <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
          <div>
            Produced:{' '}
            {actualOutputId ? (
              <Chip tone={actualOutputId === goalValueId ? 'emerald' : 'rose'}>
                {valueLabel(samples, actualOutputId, theme)}
              </Chip>
            ) : (
              <Chip tone="rose">jammed — a machine couldn’t process the value</Chip>
            )}
          </div>
          {predictedId && actualOutputId && (
            <div className="mt-1 text-slate-500">
              {predictedId === actualOutputId
                ? 'Your prediction was right.'
                : `You predicted ${valueLabel(samples, predictedId, theme)} — not quite.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
