import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { ThemeSelect } from './screens/ThemeSelect';
import { ChapterMap } from './screens/ChapterMap';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { TourScreen } from './screens/TourScreen';
import { GlossaryScreen } from './screens/GlossaryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useDebugStore } from '../devtools/debugStore';

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
        <Routes>
          <Route path="/" element={<ThemeSelect />} />
          <Route path="/intro" element={<TourScreen />} />
          <Route path="/chapters" element={<ChapterMap />} />
          <Route path="/chapter/:chapterId/puzzle/:puzzleId" element={<PuzzleScreen />} />
          <Route path="/glossary" element={<GlossaryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
