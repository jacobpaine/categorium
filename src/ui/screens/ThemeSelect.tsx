import { Link, useNavigate } from 'react-router-dom';
import { Check, GraduationCap, Sparkles } from 'lucide-react';
import { THEMES } from '../../data';
import { useProgressStore } from '../../state/progressStore';
import type { ThemeId } from '../../domain';

export function ThemeSelect() {
  const navigate = useNavigate();
  const selectedTheme = useProgressStore((s) => s.selectedTheme);
  const setTheme = useProgressStore((s) => s.setTheme);

  function choose(id: ThemeId) {
    setTheme(id);
    navigate('/chapters');
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Choose a theme</h1>
      <p className="mt-2 text-slate-600">
        Every theme uses the same puzzles and the same rules — only the labels and flavor change.
        You can switch themes at any time without losing progress.
      </p>

      <Link
        to="/intro"
        data-testid="start-walkthrough"
        className="mt-6 flex items-center justify-between gap-3 rounded-xl border-2 border-sky-200 bg-sky-50 p-4 transition hover:border-sky-400 hover:shadow"
      >
        <span className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-sky-600" aria-hidden />
          <span>
            <span className="block font-semibold text-sky-900">New here? Take the walkthrough</span>
            <span className="block text-sm text-sky-700">
              A 5-minute hands-on tour of every core idea — morphisms, composition, identity,
              isomorphisms, and functors — played on real boards.
            </span>
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-sky-700">Start →</span>
      </Link>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          return (
            <button
              key={theme.id}
              data-testid={`theme-${theme.id}`}
              onClick={() => choose(theme.id)}
              className={`rounded-xl border-2 p-5 text-left transition hover:border-sky-400 hover:shadow ${
                isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{theme.name}</h2>
                {isSelected && <Check className="h-5 w-5 text-sky-600" aria-hidden />}
              </div>
              <p className="mt-1 text-sm text-slate-600">{theme.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {theme.recommendedFor && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                    <Sparkles className="h-3 w-3" aria-hidden /> recommended for {theme.recommendedFor}
                  </span>
                )}
                {theme.pure && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                    pure mode
                  </span>
                )}
              </div>
              <p className="mt-3 font-mono text-xs text-slate-500">
                {theme.example.from} → {theme.example.machine} → {theme.example.to}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
