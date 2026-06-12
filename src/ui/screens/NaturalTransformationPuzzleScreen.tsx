/**
 * NaturalTransformationPuzzleScreen — Chapter 6. Mirrors FunctorPuzzleScreen: objective panel +
 * a context summary of the two functors, the NaturalTransformationCanvas, Run/Check via
 * `validateNaturalTransformation`, and the reveal.
 */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { PUZZLES, THEMES } from '../../data';
import { isPlayable, type NaturalTransformationPuzzle } from '../../schemas';
import {
  validateNaturalTransformation,
  type NaturalTransformationValidationResult,
} from '../../validation';
import type { ThemeId } from '../../domain';
import { useProgressStore } from '../../state/progressStore';
import { NaturalTransformationCanvas } from '../canvas/NaturalTransformationCanvas';
import { RevealPanel } from '../components/RevealPanel';

export function NaturalTransformationPuzzleScreen({ puzzle }: { puzzle: NaturalTransformationPuzzle }) {
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const setTheme = useProgressStore((s) => s.setTheme);
  const completePuzzle = useProgressStore((s) => s.completePuzzle);
  const unlockConcepts = useProgressStore((s) => s.unlockConcepts);
  const unlockGlossary = useProgressStore((s) => s.unlockGlossary);

  const [components, setComponents] = useState<Record<string, string>>({});
  const [result, setResult] = useState<NaturalTransformationValidationResult | null>(null);
  const [status, setStatus] = useState<'editing' | 'success' | 'error'>('editing');
  const [resetToken, setResetToken] = useState(0);

  const onComponentsChange = useCallback((c: Record<string, string>) => setComponents(c), []);

  const nextPuzzle = useMemo(
    () =>
      PUZZLES.find((p) => p.chapterId === puzzle.chapterId && p.order === puzzle.order + 1 && isPlayable(p)),
    [puzzle],
  );

  // Compact summary of the two functors, for context.
  const functorRows = useMemo(() => {
    const dLabel = (id: string) => puzzle.targetCategory.objects.find((o) => o.id === id)?.formalLabel ?? id;
    return puzzle.sourceCategory.objects.map((o) => ({
      obj: o.formalLabel ?? o.id,
      fa: dLabel(puzzle.functorF.objectMap[o.id]),
      ga: dLabel(puzzle.functorG.objectMap[o.id]),
    }));
  }, [puzzle]);

  function runCheck() {
    const res = validateNaturalTransformation(
      puzzle.sourceCategory,
      puzzle.targetCategory,
      puzzle.functorF,
      puzzle.functorG,
      components,
    );
    setResult(res);
    if (res.ok) {
      setStatus('success');
      completePuzzle(puzzle.id);
      unlockConcepts(puzzle.conceptTags);
      unlockGlossary(puzzle.glossaryUnlocks);
    } else {
      setStatus('error');
    }
  }

  function reset() {
    setComponents({});
    setResult(null);
    setStatus('editing');
    setResetToken((t) => t + 1);
  }

  return (
    <section className="flex h-[calc(100vh-3.25rem)] flex-col lg:flex-row">
      <aside className="w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <Link to="/chapters" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Chapters
        </Link>

        <h1 className="mt-3 text-xl font-bold">{puzzle.title[theme]}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {puzzle.conceptTags.map((tag) => (
            <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm text-slate-700">{puzzle.intro[theme]}</p>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-medium text-slate-600">Goal</div>
          <p className="text-slate-700">{puzzle.goal[theme]}</p>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-3 text-xs">
          <div className="font-medium text-slate-600">The two functors</div>
          <table className="mt-1 w-full font-mono text-[11px] text-slate-600">
            <tbody>
              {functorRows.map((r) => (
                <tr key={r.obj}>
                  <td className="pr-2 text-slate-400">{r.obj}</td>
                  <td className="pr-2">F ↦ {r.fa}</td>
                  <td>G ↦ {r.ga}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-slate-400">
            Pick a component α : F(A) → G(A) at each object so every naturality square commutes.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={runCheck}
            data-testid="run-check"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <Play className="h-4 w-4" aria-hidden /> Run / Check
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeId)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            >
              {THEMES.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === 'error' && result && !result.ok && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium text-amber-900">
              <Lightbulb className="h-4 w-4" aria-hidden /> Not natural yet
            </div>
            <p className="mt-1 text-amber-900">{result.firstFailure.message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 space-y-3" data-testid="solved">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" aria-hidden /> Solved!
              </div>
              {nextPuzzle ? (
                <Link
                  to={`/chapter/${nextPuzzle.chapterId}/puzzle/${nextPuzzle.id}`}
                  data-testid="next-puzzle"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Next puzzle <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <Link
                  to="/chapters"
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Chapter complete
                </Link>
              )}
            </div>
            <RevealPanel reveal={puzzle.reveal} theme={theme} glossaryUnlocks={puzzle.glossaryUnlocks} />
          </div>
        )}
      </aside>

      <div className="relative min-h-[24rem] flex-1">
        <NaturalTransformationCanvas
          key={`${puzzle.id}:${theme}:${resetToken}`}
          sourceCategory={puzzle.sourceCategory}
          targetCategory={puzzle.targetCategory}
          functorF={puzzle.functorF}
          functorG={puzzle.functorG}
          theme={theme}
          locked={status === 'success'}
          onComponentsChange={onComponentsChange}
        />
      </div>
    </section>
  );
}
