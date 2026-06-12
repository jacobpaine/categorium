/** Chapter metadata. Chapter 2 is a locked placeholder in the MVP. */
export type ChapterMeta = { id: string; title: string; locked: boolean };

export const CHAPTERS: ChapterMeta[] = [
  { id: 'chapter-01-transformations', title: 'The Shape of Transformation', locked: false },
  { id: 'chapter-02-laws', title: 'The Laws of Composition', locked: true },
];

export const FIRST_CHAPTER_ID = CHAPTERS[0].id;
