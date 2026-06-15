/**
 * TestCasePanel — the "make the tests pass" controls. A behavior puzzle declares one or more
 * cases (input value → expected value); the player builds ONE pipeline that must satisfy ALL of
 * them. Each case can be run on its own to watch the token flow, and after Run / Check every case
 * shows a ✓/✗ against its expected output, with an "X / N pass" summary. This turns the board from
 * "connect the dots" into "build a function that passes its test suite".
 */
import { CheckCircle2, Play, XCircle } from 'lucide-react';
import type { SampleValue, ThemeId } from '../../domain';

export type BehaviorCase = { inputValueId: string; outputValueId: string };

function label(samples: SampleValue[], id: string, theme: ThemeId): string {
  return samples.find((s) => s.id === id)?.labels[theme] ?? id;
}

export function TestCasePanel({
  samples,
  theme,
  cases,
  actualByCase,
  onRunCase,
  activeCaseInput,
  locked,
}: {
  samples: SampleValue[];
  theme: ThemeId;
  cases: BehaviorCase[];
  /** input value id → actual produced value id (null = jammed), or absent if not run yet. */
  actualByCase: Record<string, string | null>;
  onRunCase: (inputValueId: string) => void;
  activeCaseInput: string | null;
  locked: boolean;
}) {
  const ranCount = cases.filter((c) => c.inputValueId in actualByCase).length;
  const passCount = cases.filter((c) => actualByCase[c.inputValueId] === c.outputValueId).length;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {cases.length === 1 ? 'Test case' : `Test cases · ${cases.length}`}
        </span>
        {ranCount > 0 && (
          <span
            className={`text-xs font-semibold ${passCount === cases.length ? 'text-emerald-700' : 'text-slate-500'}`}
          >
            {passCount} / {cases.length} pass
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1.5">
        {cases.map((c) => {
          const ran = c.inputValueId in actualByCase;
          const actual = actualByCase[c.inputValueId];
          const pass = actual === c.outputValueId;
          const active = activeCaseInput === c.inputValueId;
          return (
            <div
              key={c.inputValueId}
              className={`rounded-md border px-2 py-1.5 ${
                !ran ? 'border-slate-200' : pass ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
              } ${active ? 'ring-2 ring-sky-300' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                {!locked && (
                  <button
                    onClick={() => onRunCase(c.inputValueId)}
                    title="Run this case and watch it flow"
                    data-testid="run-case"
                    className="shrink-0 rounded p-0.5 text-sky-600 hover:bg-sky-100"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {label(samples, c.inputValueId, theme)}
                </span>
                <span className="text-slate-400">→</span>
                <span
                  title="The required output — the value your pipeline must produce"
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-300"
                >
                  {label(samples, c.outputValueId, theme)}
                </span>
                {ran && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium">
                    {pass ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" aria-hidden />
                    )}
                  </span>
                )}
              </div>
              {ran && !pass && (
                <div className="mt-1 flex items-center gap-1.5 pl-6 text-xs text-rose-700">
                  <span>got</span>
                  {actual === null ? (
                    <span className="font-medium">a jam (a machine couldn’t process the value)</span>
                  ) : (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-800 ring-1 ring-rose-300">
                      {label(samples, actual, theme)}
                    </span>
                  )}
                  <span className="text-rose-400">≠ required output</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!locked && (
        <p className="mt-2 text-[11px] text-slate-400">
          Build one pipeline that passes every case. ▶ runs a single case so you can watch where it goes.
        </p>
      )}
    </div>
  );
}
