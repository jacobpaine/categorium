import type { Puzzle } from '../schemas';

/**
 * Chapter metadata. `available` chapters have authored puzzles; `placeholder` chapters are
 * titled previews of where the curriculum goes (see ROADMAP.md). Chapter `concepts` are plain
 * display labels — not the ConceptTag vocabulary — since placeholders name future ideas.
 */
export type ChapterStatus = 'available' | 'placeholder';

export type ChapterMeta = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  status: ChapterStatus;
};

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'chapter-01-transformations',
    title: 'The Shape of Transformation',
    summary: 'Connect things and processes to discover how transformations compose.',
    concepts: ['object', 'morphism', 'composition', 'identity', 'commutative diagram'],
    status: 'available',
  },
  {
    id: 'chapter-02-laws',
    title: 'The Laws of Composition',
    summary: 'Make the rules of composition explicit: doing nothing, and how steps group.',
    concepts: ['identity law', 'associativity'],
    status: 'available',
  },
  {
    id: 'chapter-03-isomorphisms',
    title: 'Sameness, Both Ways',
    summary: 'When two things are the same: reversible processes and lossless round-trips.',
    concepts: ['inverse', 'round-trip', 'isomorphism'],
    status: 'available',
  },
  {
    id: 'chapter-04-functors',
    title: 'Maps Between Worlds',
    summary: 'A functor maps a whole category to another, preserving sources, targets, and structure.',
    concepts: ['functor', 'structure-preserving map'],
    status: 'available',
  },
  {
    id: 'chapter-05-products',
    title: 'Combining and Choosing',
    summary: 'Products bundle two things together; coproducts let you pick one or the other.',
    concepts: ['product', 'coproduct', 'universal property'],
    status: 'available',
  },
  {
    id: 'chapter-06-natural-transformations',
    title: 'Between the Maps',
    summary: 'A natural transformation maps one functor to another, square by commuting square.',
    concepts: ['natural transformation', 'naturality', 'functor category'],
    status: 'available',
  },
  {
    id: 'chapter-07-monads',
    title: 'Boxes That Chain',
    summary: 'A monad wraps a functor with return and bind, for chaining steps that might fail or branch.',
    concepts: ['monad', 'return', 'bind'],
    status: 'available',
  },
  {
    id: 'chapter-08-limits',
    title: 'The Best Object for the Job',
    summary: 'Universal properties and limits: terminal objects, equalizers, and pullbacks — the single best object completing a shape.',
    concepts: ['terminal', 'equalizer', 'pullback', 'limit'],
    status: 'available',
  },
];

export const FIRST_CHAPTER_ID = CHAPTERS[0].id;

export function getChapter(id: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Authored puzzles for a chapter, in play order. */
export function chapterPuzzles(chapterId: string, puzzles: Puzzle[]): Puzzle[] {
  return puzzles
    .filter((p) => p.chapterId === chapterId)
    .sort((a, b) => a.order - b.order);
}

/**
 * A chapter is unlocked if it is the first chapter, or every authored puzzle of the previous
 * chapter has been completed. Placeholder chapters (no authored puzzles) are never unlocked.
 */
export function isChapterUnlocked(
  chapterId: string,
  completed: Set<string>,
  puzzles: Puzzle[],
): boolean {
  const index = CHAPTERS.findIndex((c) => c.id === chapterId);
  if (index <= 0) return index === 0; // first chapter unlocked; unknown chapter locked
  const chapter = CHAPTERS[index];
  if (chapter.status !== 'available') return false;
  const prev = CHAPTERS[index - 1];
  const prevPuzzles = chapterPuzzles(prev.id, puzzles);
  if (prevPuzzles.length === 0) return false;
  return prevPuzzles.every((p) => completed.has(p.id));
}
