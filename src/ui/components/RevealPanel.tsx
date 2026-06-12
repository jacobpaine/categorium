/**
 * Post-success formal reveal. Theme language first; formal notation and the programmer analogy
 * are progressive ("more formal" is collapsed; the code analogy is opt-in).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2 } from 'lucide-react';
import type { AuthoredPuzzle } from '../../schemas';
import { getGlossaryEntry } from '../../data';
import type { ThemeId } from '../../domain';

export function RevealPanel({
  reveal,
  theme,
  glossaryUnlocks,
}: {
  reveal: AuthoredPuzzle['reveal'];
  theme: ThemeId;
  glossaryUnlocks: string[];
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
      <h3 className="font-semibold text-emerald-900">What you learned</h3>
      <p className="mt-1 text-sm text-emerald-900">{reveal.afterSuccess[theme]}</p>

      <p className="mt-3 text-sm text-slate-700">{reveal.summary}</p>

      {reveal.notation && reveal.notation.length > 0 && (
        <div className="mt-3 space-y-1 rounded bg-white p-3 font-mono text-sm text-slate-800">
          {reveal.notation.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {reveal.moreFormal && (
        <details className="mt-3 text-sm text-slate-700">
          <summary className="cursor-pointer font-medium text-slate-600">More formal</summary>
          <p className="mt-2">{reveal.moreFormal}</p>
        </details>
      )}

      {reveal.programmerAnalogy && (
        <div className="mt-3">
          <button
            onClick={() => setShowCode((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            {showCode ? 'Hide' : 'Show'} programmer analogy
          </button>
          {showCode && (
            <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 font-mono text-xs text-slate-100">
              {reveal.programmerAnalogy}
            </pre>
          )}
        </div>
      )}

      {glossaryUnlocks.length > 0 && (
        <div className="mt-4 border-t border-emerald-200 pt-3">
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-800">
            <BookOpen className="h-3.5 w-3.5" aria-hidden /> Glossary unlocked
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {glossaryUnlocks.map((id) => {
              const entry = getGlossaryEntry(id);
              return (
                <Link
                  key={id}
                  to="/glossary"
                  className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200 hover:ring-emerald-400"
                >
                  {entry?.term ?? id}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
