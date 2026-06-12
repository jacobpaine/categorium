import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Play } from 'lucide-react';
import { PUZZLES } from '../../data';
import { isAuthored } from '../../schemas';
import { useProgressStore } from '../../state/progressStore';
import { CHAPTERS } from '../chapters';
import type { ThemeId } from '../../domain';

export function ChapterMap() {
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const completed = useProgressStore((s) => s.completedPuzzleIds);
  const completedSet = new Set(completed);

  const chapter1 = CHAPTERS[0];
  const chapter1Puzzles = PUZZLES.filter((p) => p.chapterId === chapter1.id);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">{chapter1.title}</h1>
      <p className="mt-2 text-slate-600">
        Five small puzzles. Connect things and processes to discover how transformations compose.
      </p>

      <ol className="mt-8 space-y-3">
        {chapter1Puzzles.map((puzzle, index) => {
          const done = completedSet.has(puzzle.id);
          const prevDone = index === 0 || completedSet.has(chapter1Puzzles[index - 1].id);
          const playable = isAuthored(puzzle) && prevDone;

          const card = (
            <div
              className={`flex items-center justify-between rounded-xl border p-4 ${
                playable ? 'border-slate-200 bg-white hover:border-sky-400' : 'border-slate-200 bg-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">#{puzzle.order}</span>
                  <span className="font-semibold">{puzzle.title[theme]}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {puzzle.conceptTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-sm">
                {done ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Done
                  </span>
                ) : playable ? (
                  <span className="inline-flex items-center gap-1 text-sky-600">
                    <Play className="h-4 w-4" aria-hidden /> Play
                  </span>
                ) : isAuthored(puzzle) ? (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Lock className="h-4 w-4" aria-hidden /> Locked
                  </span>
                ) : (
                  <span className="text-slate-400">Coming soon</span>
                )}
              </div>
            </div>
          );

          return (
            <li key={puzzle.id}>
              {playable ? (
                <Link to={`/chapter/${puzzle.chapterId}/puzzle/${puzzle.id}`}>{card}</Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ol>

      {/* Locked Chapter 2 placeholder. */}
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">
        <Lock className="h-4 w-4" aria-hidden />
        <div>
          <div className="font-semibold">{CHAPTERS[1].title}</div>
          <div className="text-sm">Locked — complete Chapter 1 first.</div>
        </div>
      </div>
    </section>
  );
}
