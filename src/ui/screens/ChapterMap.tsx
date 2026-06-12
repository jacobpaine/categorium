import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Play } from 'lucide-react';
import { PUZZLES } from '../../data';
import { isAuthored } from '../../schemas';
import type { Puzzle } from '../../schemas';
import { useProgressStore } from '../../state/progressStore';
import { CHAPTERS, chapterPuzzles, isChapterUnlocked, type ChapterMeta } from '../chapters';
import type { ThemeId } from '../../domain';

export function ChapterMap() {
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const completed = useProgressStore((s) => s.completedPuzzleIds);
  const completedSet = new Set(completed);

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Chapters</h1>
      <p className="mt-2 text-slate-600">
        Each chapter unlocks when you finish the one before it.
      </p>

      <div className="mt-8 space-y-10">
        {CHAPTERS.map((chapter, index) => (
          <ChapterSection
            key={chapter.id}
            chapter={chapter}
            number={index + 1}
            theme={theme}
            completedSet={completedSet}
          />
        ))}
      </div>
    </section>
  );
}

function ChapterSection({
  chapter,
  number,
  theme,
  completedSet,
}: {
  chapter: ChapterMeta;
  number: number;
  theme: ThemeId;
  completedSet: Set<string>;
}) {
  const puzzles = chapterPuzzles(chapter.id, PUZZLES);
  const unlocked = chapter.status === 'available' && isChapterUnlocked(chapter.id, completedSet, PUZZLES);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold text-slate-400">Chapter {number}</span>
        {chapter.status !== 'available' && (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            preview
          </span>
        )}
      </div>
      <h2 className="mt-0.5 text-xl font-bold">{chapter.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{chapter.summary}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {chapter.concepts.map((c) => (
          <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
            {c}
          </span>
        ))}
      </div>

      {chapter.status === 'available' && unlocked ? (
        <ol className="mt-4 space-y-3">
          {puzzles.map((puzzle, index) => (
            <PuzzleRow
              key={puzzle.id}
              puzzle={puzzle}
              prevDone={index === 0 || completedSet.has(puzzles[index - 1].id)}
              done={completedSet.has(puzzle.id)}
              theme={theme}
            />
          ))}
        </ol>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          <Lock className="h-4 w-4" aria-hidden />
          {chapter.status === 'available'
            ? 'Locked — finish the previous chapter first.'
            : 'Coming soon.'}
        </div>
      )}
    </div>
  );
}

function PuzzleRow({
  puzzle,
  prevDone,
  done,
  theme,
}: {
  puzzle: Puzzle;
  prevDone: boolean;
  done: boolean;
  theme: ThemeId;
}) {
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
            <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
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
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Lock className="h-4 w-4" aria-hidden /> Locked
          </span>
        )}
      </div>
    </div>
  );

  return (
    <li>
      {playable ? (
        <Link to={`/chapter/${puzzle.chapterId}/puzzle/${puzzle.id}`} data-testid={`puzzle-link-${puzzle.id}`}>
          {card}
        </Link>
      ) : (
        card
      )}
    </li>
  );
}
