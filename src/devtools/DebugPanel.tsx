/**
 * Debug panel (visible when `?debug=true`). Context-aware on the puzzle screen: shows the
 * puzzle JSON, the parsed/validation state against the *live* constructed graph, theme
 * mappings, progress state, and any content load errors — plus quick dev actions.
 */
import { Bug, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AuthoredPuzzle } from '../schemas';
import type { ThemeId } from '../domain';
import { THEME_IDS } from '../domain';
import { PUZZLE_LOAD_ERRORS, toValidationInput } from '../data';
import { validatePuzzle } from '../validation';
import { useProgressStore } from '../state/progressStore';
import { useDebugStore } from './debugStore';

function Section({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="border-t border-slate-700 py-1.5">
      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </summary>
      <div className="mt-1.5 text-xs text-slate-200">{children}</div>
    </details>
  );
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-48 overflow-auto rounded bg-slate-950 p-2 text-[11px] leading-snug text-slate-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function DebugPanel({ puzzle, theme }: { puzzle: AuthoredPuzzle; theme: ThemeId }) {
  const setEnabled = useDebugStore((s) => s.setEnabled);
  const savedGraph = useProgressStore((s) => s.inProgressGraphs[puzzle.id]);
  // Select fields individually — a selector returning a fresh object each render would loop.
  const selectedTheme = useProgressStore((s) => s.selectedTheme);
  const completedPuzzleIds = useProgressStore((s) => s.completedPuzzleIds);
  const unlockedConcepts = useProgressStore((s) => s.unlockedConcepts);
  const glossaryUnlocks = useProgressStore((s) => s.glossaryUnlocks);
  const progress = { selectedTheme, completedPuzzleIds, unlockedConcepts, glossaryUnlocks };
  const completePuzzle = useProgressStore((s) => s.completePuzzle);
  const unlockConcepts = useProgressStore((s) => s.unlockConcepts);
  const unlockGlossary = useProgressStore((s) => s.unlockGlossary);
  const resetPuzzleGraph = useProgressStore((s) => s.resetPuzzleGraph);
  const clearAllProgress = useProgressStore((s) => s.clearAllProgress);

  const graph = savedGraph ?? puzzle.initialGraph;
  const result = validatePuzzle(toValidationInput(puzzle), graph);
  const failing = new Set(result.ok ? [] : result.failures.map((f) => JSON.stringify(f.rule)));

  return (
    <div className="fixed bottom-3 right-3 z-50 flex max-h-[78vh] w-[22rem] flex-col rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Bug className="h-4 w-4 text-emerald-400" aria-hidden /> Debug
        </div>
        <button
          onClick={() => setEnabled(false)}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Close debug panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="overflow-y-auto px-3 pb-3">
        <Section title="Validation (live graph)" open>
          <div className={`font-semibold ${result.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
            {result.ok ? 'ok' : `failing: ${result.failures.length}`}
          </div>
          <ul className="mt-1 space-y-0.5">
            {puzzle.validation.map((rule, i) => {
              const bad = failing.has(JSON.stringify(rule));
              return (
                <li key={i} className="flex items-start gap-1.5 font-mono text-[11px]">
                  <span className={bad ? 'text-amber-400' : 'text-emerald-400'}>{bad ? '✗' : '✓'}</span>
                  <span className="text-slate-300">{rule.type}</span>
                </li>
              );
            })}
          </ul>
          {!result.ok && (
            <p className="mt-1 text-[11px] text-amber-300">{result.firstFailure.message}</p>
          )}
        </Section>

        <Section title="Theme mappings">
          <div className="mb-1 text-[11px] text-slate-500">active theme: {theme}</div>
          <div className="space-y-1 font-mono text-[11px]">
            {[...puzzle.objects.map((o) => ({ label: o.formalLabel ?? o.id, t: o.labels })),
              ...puzzle.morphisms.map((m) => ({ label: m.formalLabel ?? m.id, t: m.labels }))].map(
              (row, i) => (
                <div key={i} className="text-slate-300">
                  <span className="text-slate-500">{row.label}:</span>{' '}
                  {THEME_IDS.map((t) => row.t[t]).join(' = ')}
                </div>
              ),
            )}
          </div>
        </Section>

        <Section title="Graph state">
          <div className="text-[11px] text-slate-400">
            {graph.nodes.length} nodes · {graph.edges.length} edges{savedGraph ? ' (live)' : ' (initial)'}
          </div>
          <Json value={graph} />
        </Section>

        <Section title="Puzzle JSON">
          <Json value={puzzle} />
        </Section>

        <Section title="Progress state">
          <Json value={progress} />
        </Section>

        <Section title={`Content errors (${PUZZLE_LOAD_ERRORS.length})`}>
          {PUZZLE_LOAD_ERRORS.length === 0 ? (
            <div className="text-[11px] text-emerald-400">All puzzle JSON parsed cleanly.</div>
          ) : (
            PUZZLE_LOAD_ERRORS.map((e) => (
              <div key={e.id} className="mb-1">
                <div className="text-[11px] font-semibold text-amber-400">{e.id}</div>
                <pre className="max-h-32 overflow-auto rounded bg-slate-950 p-1 text-[10px] text-slate-400">
                  {e.error}
                </pre>
              </div>
            ))
          )}
        </Section>

        <Section title="Actions" open>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                completePuzzle(puzzle.id);
                unlockConcepts(puzzle.conceptTags);
                unlockGlossary(puzzle.glossaryUnlocks);
              }}
              className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-medium hover:bg-emerald-500"
            >
              Mark complete
            </button>
            <button
              onClick={() => resetPuzzleGraph(puzzle.id)}
              className="rounded bg-slate-700 px-2 py-1 text-[11px] font-medium hover:bg-slate-600"
            >
              Reset graph
            </button>
            <button
              onClick={() => clearAllProgress()}
              className="rounded bg-rose-700 px-2 py-1 text-[11px] font-medium hover:bg-rose-600"
            >
              Clear all progress
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
