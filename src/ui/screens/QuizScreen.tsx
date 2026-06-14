/**
 * QuizScreen — a study aid that associates each theme's vocabulary with the formal category-theory
 * idea it stands for. Two questions per glossary term; the wording follows the selected theme
 * (same logic, re-themed prompts). One question at a time, with immediate feedback, an explanation,
 * and a running score. Switching theme restarts the quiz in the new vocabulary.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, GraduationCap, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ, GLOSSARY, THEMES } from '../../data';
import { useProgressStore } from '../../state/progressStore';
import type { ThemeId } from '../../domain';

export function QuizScreen() {
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const setTheme = useProgressStore((s) => s.setTheme);

  // Restart whenever the theme changes by keying the inner quiz on the theme.
  return <QuizRun key={theme} theme={theme} setTheme={setTheme} />;
}

function QuizRun({ theme, setTheme }: { theme: ThemeId; setTheme: (t: ThemeId) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = QUIZ.length;
  const q = QUIZ[index];
  const termName = useMemo(
    () => GLOSSARY.find((g) => g.id === q?.termId)?.term ?? q?.termId,
    [q],
  );

  function pick(i: number) {
    if (selected !== null) return; // locked after first choice
    setSelected(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  const themeSelector = (
    <label className="flex items-center gap-2 text-sm text-slate-600">
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
  );

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold">Quiz complete</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <div className="text-sm uppercase tracking-wide text-slate-400">Your score</div>
          <div className="mt-1 text-4xl font-bold text-slate-800" data-testid="quiz-score">
            {score} / {total}
          </div>
          <p className="mt-2 text-slate-600">
            {pct === 100 ? 'Perfect — you know the vocabulary cold.' : pct >= 70 ? 'Solid. A few worth a second look.' : 'Keep at it — revisit the Glossary and try again.'}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={restart}
            data-testid="quiz-restart"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Try again
          </button>
          <Link to="/glossary" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Review the Glossary
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold">
          <GraduationCap className="h-6 w-6 text-sky-600" aria-hidden /> Quiz
        </h1>
        {themeSelector}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Match each theme's words to the category theory they stand for.
      </p>

      {/* progress */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500" data-testid="quiz-progress">
          {index + 1} / {total}
        </span>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{termName}</div>
        <p className="mt-1 text-lg font-medium text-slate-800">{q.prompt[theme]}</p>

        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const isChosen = selected === i;
            const reveal = selected !== null;
            const state = !reveal
              ? 'idle'
              : opt.correct
                ? 'correct'
                : isChosen
                  ? 'wrong'
                  : 'muted';
            const cls = {
              idle: 'border-slate-200 bg-white hover:border-sky-400',
              correct: 'border-emerald-400 bg-emerald-50',
              wrong: 'border-rose-400 bg-rose-50',
              muted: 'border-slate-200 bg-slate-50 text-slate-400',
            }[state];
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={reveal}
                data-testid="quiz-option"
                className={`flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition ${cls}`}
              >
                <span>{opt.text}</span>
                {reveal && opt.correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
                {reveal && isChosen && !opt.correct && <XCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" data-testid="quiz-explanation">
            <span className="font-medium">{q.options[selected].correct ? 'Correct. ' : 'Not quite. '}</span>
            {q.explanation[theme]}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">Score: {score}</span>
          <button
            onClick={next}
            disabled={selected === null}
            data-testid="quiz-next"
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {index + 1 >= total ? 'See score' : 'Next'}
          </button>
        </div>
      </div>
    </section>
  );
}
