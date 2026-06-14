import { describe, it, expect } from 'vitest';
import { QUIZ, GLOSSARY } from './index';

describe('the glossary quiz', () => {
  it('has exactly two questions per glossary term, covering every term', () => {
    const byTerm = new Map<string, number>();
    for (const q of QUIZ) byTerm.set(q.termId, (byTerm.get(q.termId) ?? 0) + 1);
    for (const entry of GLOSSARY) {
      expect(byTerm.get(entry.id), `term '${entry.id}' should have 2 questions`).toBe(2);
    }
    // No questions for unknown terms.
    for (const termId of byTerm.keys()) {
      expect(GLOSSARY.some((g) => g.id === termId), `unknown term '${termId}'`).toBe(true);
    }
    expect(QUIZ.length).toBe(GLOSSARY.length * 2);
  });

  it('every question has exactly one correct option', () => {
    for (const q of QUIZ) {
      const correct = q.options.filter((o) => o.correct);
      expect(correct.length, `${q.id} must have exactly one correct option`).toBe(1);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every question has a prompt and explanation in all four themes', () => {
    for (const q of QUIZ) {
      for (const theme of ['data', 'alchemy', 'spellcraft', 'abstract'] as const) {
        expect(q.prompt[theme]?.length, `${q.id} prompt.${theme}`).toBeGreaterThan(0);
        expect(q.explanation[theme]?.length, `${q.id} explanation.${theme}`).toBeGreaterThan(0);
      }
    }
  });

  it('question ids are unique', () => {
    const ids = QUIZ.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
