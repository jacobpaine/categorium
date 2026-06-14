import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Play, RotateCcw } from 'lucide-react';
import { getPuzzle, PUZZLES, toDiagram, toValidationInput, THEMES } from '../../data';
import { isAuthored, isNaturalTransformationPuzzle, isMatchingPuzzle } from '../../schemas';
import { NaturalTransformationPuzzleScreen } from './NaturalTransformationPuzzleScreen';
import { MatchingPuzzleScreen } from './MatchingPuzzleScreen';
import { validatePuzzle, type ValidationResult } from '../../validation';
import { useProgressStore } from '../../state/progressStore';
import { useDebugStore } from '../../devtools/debugStore';
import { DebugPanel } from '../../devtools/DebugPanel';
import type { PuzzleGraph, ThemeId } from '../../domain';
import { tracePath, runChain } from '../../domain';
import { PuzzleCanvas } from '../canvas/PuzzleCanvas';
import type { BehaviorContext } from '../canvas/sampleAnimation';
import { RevealPanel } from '../components/RevealPanel';
import { TestCasePanel, type BehaviorCase } from '../components/TestCasePanel';
import { SolutionPreview } from '../components/SolutionPreview';

type RunStatus = 'editing' | 'success' | 'error';

/** Wrapper: remount the inner screen per puzzle so all local state resets on navigation. */
export function PuzzleScreen() {
  const { puzzleId } = useParams();
  const puzzle = puzzleId ? getPuzzle(puzzleId) : undefined;
  if (puzzle && isNaturalTransformationPuzzle(puzzle)) {
    return <NaturalTransformationPuzzleScreen key={puzzleId} puzzle={puzzle} />;
  }
  if (puzzle && isMatchingPuzzle(puzzle)) {
    return <MatchingPuzzleScreen key={puzzleId} puzzle={puzzle} />;
  }
  return <PuzzleScreenInner key={puzzleId ?? 'none'} puzzleId={puzzleId} />;
}

function PuzzleScreenInner({ puzzleId }: { puzzleId?: string }) {
  const puzzle = puzzleId ? getPuzzle(puzzleId) : undefined;
  const authored = puzzle && isAuthored(puzzle) ? puzzle : undefined;

  // --- store (hooks must run unconditionally) ---
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const setTheme = useProgressStore((s) => s.setTheme);
  const savedGraph = useProgressStore((s) => (authored ? s.inProgressGraphs[authored.id] : undefined));
  const saveGraph = useProgressStore((s) => s.saveGraph);
  const resetPuzzleGraph = useProgressStore((s) => s.resetPuzzleGraph);
  const completePuzzle = useProgressStore((s) => s.completePuzzle);
  const unlockConcepts = useProgressStore((s) => s.unlockConcepts);
  const unlockGlossary = useProgressStore((s) => s.unlockGlossary);
  const debug = useDebugStore((s) => s.enabled);

  const [showFormal, setShowFormal] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<RunStatus>('editing');
  const [resetToken, setResetToken] = useState(0);
  const [runSignal, setRunSignal] = useState(0);
  const [actualByCase, setActualByCase] = useState<Record<string, string | null>>({});
  const [activeCaseInput, setActiveCaseInput] = useState<string | null>(null);
  const graphRef = useRef<PuzzleGraph | null>(null);

  const diagram = useMemo(() => (authored ? toDiagram(authored) : null), [authored]);

  // Behavior puzzles carry sample values + one or more `required-output` rules — these are the
  // TEST CASES: the player builds one pipeline that must satisfy them all (see TestCasePanel).
  const behaviorCases = useMemo<BehaviorCase[]>(
    () =>
      (authored?.validation ?? [])
        .filter((r) => r.type === 'required-output')
        .map((r) => ({ inputValueId: r.inputValueId, outputValueId: r.outputValueId })),
    [authored],
  );
  const samples = authored?.samples ?? [];
  const isBehavior = behaviorCases.length > 0 && samples.length > 0;

  const labelOf = useCallback(
    (valueId: string) => samples.find((s) => s.id === valueId)?.labels[theme] ?? valueId,
    [samples, theme],
  );
  // The token animates whichever case the player last ran (defaults to the first case).
  const animateInput = activeCaseInput ?? behaviorCases[0]?.inputValueId;
  const behaviorFlow = useMemo<BehaviorContext | undefined>(
    () =>
      isBehavior && diagram && animateInput
        ? { diagram, inputValueId: animateInput, labelOf }
        : undefined,
    [isBehavior, diagram, animateInput, labelOf],
  );

  // Theme-resolved value shown on the flowing sample token at each object (sample > label).
  const tokenValueByObjectId = useMemo(() => {
    const map: Record<string, string> = {};
    if (!authored || !diagram) return map;
    for (const o of diagram.objects) map[o.id] = o.labels[theme];
    for (const s of authored.samples ?? []) map[s.objectId] = s.labels[theme];
    return map;
  }, [authored, diagram, theme]);

  const onGraphChange = useCallback(
    (g: PuzzleGraph) => {
      graphRef.current = g;
      if (authored) saveGraph(authored.id, g);
    },
    [authored, saveGraph],
  );

  if (!authored || !diagram) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold">Puzzle not available</h1>
        <p className="mt-2 text-slate-600">
          This puzzle isn’t playable yet. It may still be in preview.
        </p>
        <Link to="/chapters" className="mt-4 inline-block text-sky-700 hover:underline">
          ← Back to chapters
        </Link>
      </section>
    );
  }

  const initialGraph: PuzzleGraph = savedGraph ?? authored.initialGraph;
  const canvasKey = `${authored.id}:${theme}:${resetToken}`;
  const nextPuzzle = PUZZLES.find(
    (p) => p.chapterId === authored.chapterId && p.order === authored.order + 1 && isAuthored(p),
  );

  /** Run one test case's value through the wired pipeline; record its actual output + animate it. */
  function runCase(inputValueId: string) {
    if (!diagram) return;
    const graph = graphRef.current ?? initialGraph;
    const traced = tracePath(diagram, graph);
    const out = traced.ok ? runChain(diagram, traced.value.morphismIds, inputValueId) : null;
    setActualByCase((m) => ({ ...m, [inputValueId]: out && out.ok ? out.value : null }));
    setActiveCaseInput(inputValueId);
    setRunSignal((s) => s + 1);
  }

  function runCheck() {
    const graph = graphRef.current ?? initialGraph;
    const res = validatePuzzle(toValidationInput(authored!), graph);
    setResult(res);

    // Behavior puzzles: run every test case through and record what each produced.
    if (isBehavior && diagram) {
      const traced = tracePath(diagram, graph);
      const next: Record<string, string | null> = {};
      for (const c of behaviorCases) {
        const out = traced.ok ? runChain(diagram, traced.value.morphismIds, c.inputValueId) : null;
        next[c.inputValueId] = out && out.ok ? out.value : null;
      }
      setActualByCase(next);
      setActiveCaseInput(behaviorCases[0]?.inputValueId ?? null);
      setRunSignal((s) => s + 1);
    }

    if (res.ok) {
      setStatus('success');
      completePuzzle(authored!.id);
      unlockConcepts(authored!.conceptTags);
      unlockGlossary(authored!.glossaryUnlocks);
      setShowFormal(true);
    } else {
      setStatus('error');
    }
  }

  function reset() {
    if (
      !window.confirm('Reset this puzzle? Your wiring will be cleared, but your completion is kept.')
    ) {
      return;
    }
    resetPuzzleGraph(authored!.id);
    graphRef.current = null;
    setResult(null);
    setStatus('editing');
    setResetToken((t) => t + 1);
    setActualByCase({});
    setActiveCaseInput(null);
  }

  return (
    <section className="flex h-[calc(100vh-3.25rem)] flex-col lg:flex-row">
      {/* Objective + controls panel */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <Link
          to="/chapters"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Chapters
        </Link>

        <h1 className="mt-3 text-xl font-bold">{authored.title[theme]}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {authored.conceptTags.map((tag) => (
            <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm text-slate-700">{authored.intro[theme]}</p>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-medium text-slate-600">Goal</div>
          <p className="text-slate-700">{authored.goal[theme]}</p>
        </div>

        {authored.referenceDiagram && (
          <div className="mt-3 rounded-lg border border-slate-200 p-2 text-sm">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {authored.referenceLabel?.[theme] ?? 'For reference'}
            </div>
            <div className="mt-1">
              <SolutionPreview
                diagram={{
                  objects: authored.referenceDiagram.objects,
                  morphisms: authored.referenceDiagram.morphisms,
                }}
                graph={authored.referenceDiagram.graph}
                theme={theme}
              />
            </div>
          </div>
        )}

        {isBehavior && (
          <TestCasePanel
            samples={samples}
            theme={theme}
            cases={behaviorCases}
            actualByCase={actualByCase}
            onRunCase={runCase}
            activeCaseInput={activeCaseInput}
            locked={status === 'success'}
          />
        )}

        {/* Controls */}
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
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <span>Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeId)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-slate-600">
            <input
              type="checkbox"
              checked={showFormal}
              onChange={(e) => setShowFormal(e.target.checked)}
            />
            <span>Formal labels</span>
          </label>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Switching theme changes only the labels — the puzzle and rules stay the same.
        </p>

        {/* Feedback */}
        {status === 'error' && result && !result.ok && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium text-amber-900">
              <Lightbulb className="h-4 w-4" aria-hidden /> Not quite yet
            </div>
            <p className="mt-1 text-amber-900">{result.firstFailure.message}</p>
            {result.firstFailure.nearConcept && (
              <p className="mt-1 text-xs text-amber-700">
                You’re close to the idea of <strong>{result.firstFailure.nearConcept}</strong>.
              </p>
            )}
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

            <RevealPanel
              reveal={authored.reveal}
              theme={theme}
              glossaryUnlocks={authored.glossaryUnlocks}
            />

            {authored.referenceSolution && (
              <details className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <summary className="cursor-pointer font-medium text-slate-600">
                  See a reference solution
                </summary>
                <p className="mt-1 text-xs text-slate-500">
                  One canonical way to solve it. Other valid solutions are accepted too.
                </p>
                <div className="mt-2">
                  <SolutionPreview diagram={diagram} graph={authored.referenceSolution} theme={theme} />
                </div>
              </details>
            )}
          </div>
        )}
      </aside>

      {/* Canvas */}
      <div className="relative min-h-[24rem] flex-1">
        <PuzzleCanvas
          key={canvasKey}
          diagram={diagram}
          initialGraph={initialGraph}
          theme={theme}
          showFormalLabels={showFormal}
          animated={status === 'success'}
          locked={status === 'success'}
          tokenValueByObjectId={tokenValueByObjectId}
          behaviorFlow={behaviorFlow}
          runSignal={runSignal}
          onGraphChange={onGraphChange}
        />
      </div>

      {debug && <DebugPanel puzzle={authored} theme={theme} />}
    </section>
  );
}
