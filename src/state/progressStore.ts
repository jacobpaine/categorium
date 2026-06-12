/**
 * Progress state — Zustand persisted to localStorage. No accounts, no backend.
 *
 * Shape is defined here in the foundation session; the UI wires to it next session. Keeping
 * the store framework-light (plain selectors/actions) means components stay thin.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId, PuzzleGraph } from '../domain';
import type { ConceptTag } from '../validation';

export type ProgressState = {
  /** Currently selected global theme, or null until the player picks one. */
  selectedTheme: ThemeId | null;
  /** Ids of puzzles the player has completed. */
  completedPuzzleIds: string[];
  /** Concepts unlocked (drives formal-notation reveal toggles). */
  unlockedConcepts: ConceptTag[];
  /** Glossary entry ids unlocked. */
  glossaryUnlocks: string[];
  /** In-progress constructed graph per puzzle id. */
  inProgressGraphs: Record<string, PuzzleGraph>;

  setTheme: (theme: ThemeId) => void;
  completePuzzle: (puzzleId: string) => void;
  unlockConcepts: (concepts: ConceptTag[]) => void;
  unlockGlossary: (entryIds: string[]) => void;
  saveGraph: (puzzleId: string, graph: PuzzleGraph) => void;
  /** Drop the in-progress graph for a puzzle (e.g. "reset current puzzle"). */
  resetPuzzleGraph: (puzzleId: string) => void;
  /** Wipe everything (settings / dev "clear all progress"). */
  clearAllProgress: () => void;
};

const initialData = {
  selectedTheme: null as ThemeId | null,
  completedPuzzleIds: [] as string[],
  unlockedConcepts: [] as ConceptTag[],
  glossaryUnlocks: [] as string[],
  inProgressGraphs: {} as Record<string, PuzzleGraph>,
};

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      ...initialData,

      setTheme: (theme) => set({ selectedTheme: theme }),

      completePuzzle: (puzzleId) =>
        set((s) => ({ completedPuzzleIds: uniq([...s.completedPuzzleIds, puzzleId]) })),

      unlockConcepts: (concepts) =>
        set((s) => ({ unlockedConcepts: uniq([...s.unlockedConcepts, ...concepts]) })),

      unlockGlossary: (entryIds) =>
        set((s) => ({ glossaryUnlocks: uniq([...s.glossaryUnlocks, ...entryIds]) })),

      saveGraph: (puzzleId, graph) =>
        set((s) => ({ inProgressGraphs: { ...s.inProgressGraphs, [puzzleId]: graph } })),

      resetPuzzleGraph: (puzzleId) =>
        set((s) => {
          const next = { ...s.inProgressGraphs };
          delete next[puzzleId];
          return { inProgressGraphs: next };
        }),

      clearAllProgress: () => set({ ...initialData }),
    }),
    { name: 'categorium-progress' },
  ),
);
