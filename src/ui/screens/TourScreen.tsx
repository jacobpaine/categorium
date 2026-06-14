/**
 * TourScreen — the interactive introduction ("Chapter 0"). It walks the player through the core
 * definitions (morphism, composition, identity, isomorphism, functor) on REAL game boards: each
 * step is a playable behavior puzzle (reusing PuzzleCanvas + the value runtime + validation), wrapped
 * in guided chrome — a step counter, an instruction banner (the step's own `intro`), and on success
 * a "what you learned" reveal plus a Next button. Finishing unlocks the matching glossary entries.
 *
 * It deliberately does NOT persist progress (the tour is replayable and ephemeral) — it only writes
 * the glossary/concept unlocks so the definitions you just played through show up in the Glossary.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, GraduationCap, Play, RotateCcw } from 'lucide-react';
import { TOUR, toDiagram, toValidationInput, THEMES } from '../../data';
import { validatePuzzle, type ValidationResult } from '../../validation';
import { useProgressStore } from '../../state/progressStore';
import type { AuthoredPuzzle } from '../../schemas';
import type { PuzzleGraph, ThemeId } from '../../domain';
import { tracePath, runChain } from '../../domain';
import { PuzzleCanvas } from '../canvas/PuzzleCanvas';
import type { BehaviorContext } from '../canvas/sampleAnimation';
import { RevealPanel } from '../components/RevealPanel';
import { TestCasePanel, type BehaviorCase } from '../components/TestCasePanel';
import { SolutionPreview } from '../components/SolutionPreview';

const FIRST_CHAPTER = '/chapter/chapter-01-transformations/puzzle/puzzle-01';

export function TourScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const setTheme = useProgressStore((s) => s.setTheme);
  const navigate = useNavigate();

  const step = TOUR[stepIndex];
  const isLast = stepIndex === TOUR.length - 1;

  const next = useCallback(() => {
    if (isLast) navigate(FIRST_CHAPTER);
    else setStepIndex((i) => Math.min(i + 1, TOUR.length - 1));
  }, [isLast, navigate]);

  return (
    <section className="flex h-[calc(100vh-3.25rem)] flex-col">
      {/* Progress header */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <GraduationCap className="h-4 w-4 text-sky-600" aria-hidden /> Walkthrough
        </span>
        <div className="flex flex-1 items-center gap-1.5" aria-hidden>
          {TOUR.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                i < stepIndex ? 'bg-emerald-400' : i === stepIndex ? 'bg-sky-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500" data-testid="tour-progress">
          Step {stepIndex + 1} of {TOUR.length}
        </span>
        <Link to="/chapters" className="text-xs text-slate-400 hover:text-slate-700">
          Skip
        </Link>
      </div>

      <TourStep
        key={`${step.id}:${theme}`}
        step={step}
        theme={theme}
        setTheme={setTheme}
        isLast={isLast}
        onNext={next}
      />
    </section>
  );
}

type RunStatus = 'editing' | 'success' | 'error';

function TourStep({
  step,
  theme,
  setTheme,
  isLast,
  onNext,
}: {
  step: AuthoredPuzzle;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  isLast: boolean;
  onNext: () => void;
}) {
  const unlockConcepts = useProgressStore((s) => s.unlockConcepts);
  const unlockGlossary = useProgressStore((s) => s.unlockGlossary);

  const [showFormal, setShowFormal] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<RunStatus>('editing');
  const [resetToken, setResetToken] = useState(0);
  const [runSignal, setRunSignal] = useState(0);
  const [actualByCase, setActualByCase] = useState<Record<string, string | null>>({});
  const [activeCaseInput, setActiveCaseInput] = useState<string | null>(null);
  const graphRef = useRef<PuzzleGraph | null>(null);

  const diagram = useMemo(() => toDiagram(step), [step]);

  const behaviorCases = useMemo<BehaviorCase[]>(
    () =>
      step.validation
        .filter((r) => r.type === 'required-output')
        .map((r) => ({ inputValueId: r.inputValueId, outputValueId: r.outputValueId })),
    [step],
  );
  const samples = step.samples ?? [];
  const isBehavior = behaviorCases.length > 0 && samples.length > 0;

  const labelOf = useCallback(
    (valueId: string) => samples.find((s) => s.id === valueId)?.labels[theme] ?? valueId,
    [samples, theme],
  );
  const animateInput = activeCaseInput ?? behaviorCases[0]?.inputValueId;
  const behaviorFlow = useMemo<BehaviorContext | undefined>(
    () =>
      isBehavior && animateInput
        ? { diagram, inputValueId: animateInput, labelOf }
        : undefined,
    [isBehavior, diagram, animateInput, labelOf],
  );

  const tokenValueByObjectId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of diagram.objects) map[o.id] = o.labels[theme];
    for (const s of samples) map[s.objectId] = s.labels[theme];
    return map;
  }, [diagram, samples, theme]);

  const onGraphChange = useCallback((g: PuzzleGraph) => {
    graphRef.current = g;
  }, []);

  function runCase(inputValueId: string) {
    const graph = graphRef.current ?? step.initialGraph;
    const traced = tracePath(diagram, graph);
    const out = traced.ok ? runChain(diagram, traced.value.morphismIds, inputValueId) : null;
    setActualByCase((m) => ({ ...m, [inputValueId]: out && out.ok ? out.value : null }));
    setActiveCaseInput(inputValueId);
    setRunSignal((s) => s + 1);
  }

  function runCheck() {
    const graph = graphRef.current ?? step.initialGraph;
    const res = validatePuzzle(toValidationInput(step), graph);
    setResult(res);

    if (isBehavior) {
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
      unlockConcepts(step.conceptTags);
      unlockGlossary(step.glossaryUnlocks);
      setShowFormal(true);
    } else {
      setStatus('error');
    }
  }

  function reset() {
    graphRef.current = null;
    setResult(null);
    setStatus('editing');
    setResetToken((t) => t + 1);
    setActualByCase({});
    setActiveCaseInput(null);
  }

  const canvasKey = `${step.id}:${theme}:${resetToken}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Instruction + controls panel */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-5 lg:w-96 lg:border-b-0 lg:border-r">
        <h1 className="text-xl font-bold">{step.title[theme]}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {step.conceptTags.map((tag) => (
            <span key={tag} className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm text-slate-700">{step.intro[theme]}</p>

        {step.referenceDiagram && (
          <div className="mt-3 rounded-lg border border-slate-200 p-2 text-sm">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {step.referenceLabel?.[theme] ?? 'For reference'}
            </div>
            <div className="mt-1">
              <SolutionPreview
                diagram={{
                  objects: step.referenceDiagram.objects,
                  morphisms: step.referenceDiagram.morphisms,
                }}
                graph={step.referenceDiagram.graph}
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
            <input type="checkbox" checked={showFormal} onChange={(e) => setShowFormal(e.target.checked)} />
            <span>Formal labels</span>
          </label>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Tip: hover any element to see what it represents.</p>

        {status === 'error' && result && !result.ok && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-medium">Not quite yet</div>
            <p className="mt-1">{result.firstFailure.message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 space-y-3" data-testid="solved">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" aria-hidden /> Nice!
              </div>
              <button
                onClick={onNext}
                data-testid="tour-next"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {isLast ? 'Start Chapter 1' : 'Next'} <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <RevealPanel reveal={step.reveal} theme={theme} glossaryUnlocks={step.glossaryUnlocks} />
          </div>
        )}
      </aside>

      <div className="relative min-h-[24rem] flex-1">
        <PuzzleCanvas
          key={canvasKey}
          diagram={diagram}
          initialGraph={step.initialGraph}
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
    </div>
  );
}
