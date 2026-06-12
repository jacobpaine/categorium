import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { THEMES } from '../../data';
import { useProgressStore } from '../../state/progressStore';
import type { ThemeId } from '../../domain';

export function SettingsScreen() {
  const navigate = useNavigate();
  const theme = useProgressStore((s) => s.selectedTheme);
  const setTheme = useProgressStore((s) => s.setTheme);
  const completedCount = useProgressStore((s) => s.completedPuzzleIds.length);
  const clearAllProgress = useProgressStore((s) => s.clearAllProgress);

  function clearAll() {
    if (window.confirm('Clear ALL progress? This removes completions, unlocks, and saved graphs.')) {
      clearAllProgress();
      navigate('/');
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="font-semibold">Theme</h2>
          <p className="text-sm text-slate-600">Changes labels and flavor only — never the logic.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  theme === t.id
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Progress</h2>
          <p className="text-sm text-slate-600">{completedCount} puzzle(s) completed.</p>
          <button
            onClick={clearAll}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Clear all progress
          </button>
        </div>
      </div>
    </section>
  );
}
