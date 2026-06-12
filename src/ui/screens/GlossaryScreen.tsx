import { Lock } from 'lucide-react';
import { GLOSSARY } from '../../data';
import { useProgressStore } from '../../state/progressStore';
import type { ThemeId } from '../../domain';

export function GlossaryScreen() {
  const theme: ThemeId = useProgressStore((s) => s.selectedTheme) ?? 'data';
  const unlocked = new Set(useProgressStore((s) => s.glossaryUnlocks));

  return (
    <section className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Glossary</h1>
      <p className="mt-2 text-slate-600">Terms unlock as you encounter them in puzzles.</p>

      <div className="mt-8 space-y-4">
        {GLOSSARY.map((entry) => {
          const isUnlocked = unlocked.has(entry.id);
          if (!isUnlocked) {
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-400"
              >
                <Lock className="h-4 w-4" aria-hidden />
                <span className="font-medium">Locked term</span>
              </div>
            );
          }
          return (
            <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold">{entry.term}</h2>
              <p className="mt-1 text-sm text-slate-700">{entry.themeExplanation[theme]}</p>
              {entry.formalDefinition && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Formally: </span>
                  {entry.formalDefinition}
                </p>
              )}
              {entry.notationExamples && entry.notationExamples.length > 0 && (
                <div className="mt-2 space-y-0.5 font-mono text-xs text-slate-500">
                  {entry.notationExamples.map((n, i) => (
                    <div key={i}>{n}</div>
                  ))}
                </div>
              )}
              {entry.programmerAnalogy && (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-medium">Like: </span>
                  <code>{entry.programmerAnalogy}</code>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
