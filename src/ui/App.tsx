import { lazy, Suspense } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { ThemeSelect } from './screens/ThemeSelect';
import { useDebugStore } from '../devtools/debugStore';

// The landing screen (ThemeSelect) stays eager so first paint is instant. The rest load on demand
// — this keeps React Flow (the heavy canvas dependency, pulled in by the puzzle/tour screens) out
// of the initial bundle. Named exports are remapped to the default `lazy` expects.
const ChapterMap = lazy(() => import('./screens/ChapterMap').then((m) => ({ default: m.ChapterMap })));
const PuzzleScreen = lazy(() => import('./screens/PuzzleScreen').then((m) => ({ default: m.PuzzleScreen })));
const TourScreen = lazy(() => import('./screens/TourScreen').then((m) => ({ default: m.TourScreen })));
const GlossaryScreen = lazy(() => import('./screens/GlossaryScreen').then((m) => ({ default: m.GlossaryScreen })));
const QuizScreen = lazy(() => import('./screens/QuizScreen').then((m) => ({ default: m.QuizScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

function RouteFallback() {
  return <div className="px-6 py-8 text-sm text-slate-400">Loading…</div>;
}

export default function App() {
  const debug = useDebugStore((s) => s.enabled);
  const setDebug = useDebugStore((s) => s.setEnabled);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="font-semibold">
            Categorium
          </Link>
          {[
            { to: '/intro', label: 'Walkthrough' },
            { to: '/chapters', label: 'Chapters' },
            { to: '/glossary', label: 'Glossary' },
            { to: '/quiz', label: 'Quiz' },
            { to: '/settings', label: 'Settings' },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }
            >
              {l.label}
            </NavLink>
          ))}
          {debug && (
            <button
              onClick={() => setDebug(false)}
              title="Debug mode on — click to disable"
              className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-200"
            >
              DEBUG ✕
            </button>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<ThemeSelect />} />
            <Route path="/intro" element={<TourScreen />} />
            <Route path="/chapters" element={<ChapterMap />} />
            <Route path="/chapter/:chapterId/puzzle/:puzzleId" element={<PuzzleScreen />} />
            <Route path="/glossary" element={<GlossaryScreen />} />
            <Route path="/quiz" element={<QuizScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <section className="px-6 py-8">
      <h1 className="text-2xl font-bold">Not found</h1>
      <Link to="/" className="mt-2 inline-block text-sky-700 hover:underline">
        Back to start
      </Link>
    </section>
  );
}
