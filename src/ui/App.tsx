import { Routes, Route, Link, useParams } from 'react-router-dom';

/**
 * Minimal route shell for the foundation session. Each screen renders a placeholder.
 * The playable vertical slice (PuzzleCanvas, theme cards, chapter map, glossary UI,
 * settings) is built next session — see SPEC.md §10.
 */
export default function App() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="font-semibold">
            Categorium
          </Link>
          <Link to="/chapters" className="text-slate-600 hover:text-slate-900">
            Chapters
          </Link>
          <Link to="/glossary" className="text-slate-600 hover:text-slate-900">
            Glossary
          </Link>
          <Link to="/settings" className="text-slate-600 hover:text-slate-900">
            Settings
          </Link>
        </nav>
      </header>
      <main className="px-6 py-8">
        <Routes>
          <Route path="/" element={<Placeholder title="Theme Selection" />} />
          <Route path="/chapters" element={<Placeholder title="Chapter Map" />} />
          <Route
            path="/chapter/:chapterId/puzzle/:puzzleId"
            element={<PuzzlePlaceholder />}
          />
          <Route path="/glossary" element={<Placeholder title="Glossary" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
          <Route path="*" element={<Placeholder title="Not Found" />} />
        </Routes>
      </main>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600">
        Placeholder screen. UI is built in the next session — see <code>SPEC.md</code> §10.
      </p>
    </section>
  );
}

function PuzzlePlaceholder() {
  const { chapterId, puzzleId } = useParams();
  return (
    <section>
      <h1 className="text-2xl font-bold">Puzzle</h1>
      <p className="mt-2 text-slate-600">
        Chapter <code>{chapterId}</code>, puzzle <code>{puzzleId}</code>. The React Flow
        canvas is built next session.
      </p>
    </section>
  );
}
