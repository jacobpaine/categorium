/**
 * Read-only thumbnail of a puzzle's canonical reference solution, shown after completion.
 * Reuses the locked PuzzleCanvas so node/wire styling matches the editable board.
 */
import type { Diagram, PuzzleGraph, ThemeId } from '../../domain';
import { PuzzleCanvas } from '../canvas/PuzzleCanvas';

const NOOP = () => {};

export function SolutionPreview({
  diagram,
  graph,
  theme,
}: {
  diagram: Diagram;
  graph: PuzzleGraph;
  theme: ThemeId;
}) {
  return (
    <div className="h-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <PuzzleCanvas
        key={theme}
        diagram={diagram}
        initialGraph={graph}
        theme={theme}
        showFormalLabels={false}
        animated
        locked
        onGraphChange={NOOP}
      />
    </div>
  );
}
