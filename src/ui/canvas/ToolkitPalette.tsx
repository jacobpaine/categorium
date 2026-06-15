/**
 * ToolkitPalette — the side tray for toolkit-mode puzzles. Lists the candidate objects and
 * morphisms the player can bring onto the board; clicking a card places it (see PuzzleCanvas's
 * click-to-place). It is plain React (NOT React Flow) and reads labels from the diagram, the same
 * source the adapter uses, so a placed node matches its tray card. Unused/distractor cards simply
 * stay here — choosing what to use (and what to leave) is the point of the mechanic.
 */
import { Cog, Plus } from 'lucide-react';
import type { Diagram, ThemeId } from '../../domain';
import { getObject, getMorphism } from '../../domain';
import { colorClasses } from './colors';

export type ToolkitPaletteProps = {
  diagram: Diagram;
  theme: ThemeId;
  showFormalLabels: boolean;
  objectIds: string[];
  morphismIds: string[];
  locked?: boolean;
  onPlace: (kind: 'object' | 'morphism', refId: string) => void;
};

function signature(diagram: Diagram, theme: ThemeId, morphismId: string, formal: boolean): string {
  const mor = getMorphism(diagram, morphismId);
  if (!mor) return '';
  const src = getObject(diagram, mor.sourceObjectId);
  const tgt = getObject(diagram, mor.targetObjectId);
  const from = (formal && src?.formalLabel) || src?.labels[theme] || mor.sourceObjectId;
  const to = (formal && tgt?.formalLabel) || tgt?.labels[theme] || mor.targetObjectId;
  return `${from} → ${to}`;
}

export function ToolkitPalette({
  diagram,
  theme,
  showFormalLabels,
  objectIds,
  morphismIds,
  locked = false,
  onPlace,
}: ToolkitPaletteProps) {
  if (objectIds.length === 0 && morphismIds.length === 0) return null;

  return (
    <aside
      data-testid="toolkit-palette"
      className="z-20 h-full w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3"
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Toolkit</h3>
      <p className="mb-3 text-[11px] leading-snug text-slate-400">
        Click a piece to add it to the board. Leave the ones you don&apos;t need here.
      </p>

      {objectIds.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Objects</p>
          <ul className="space-y-1.5">
            {objectIds.map((id) => {
              const obj = getObject(diagram, id);
              const c = colorClasses(obj?.colorToken);
              const label = obj?.labels[theme] ?? id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={locked}
                    data-testid={`tray-object-${id}`}
                    onClick={() => onPlace('object', id)}
                    className={`group flex w-full items-center gap-2 rounded-full border-2 px-3 py-1.5 text-left text-sm font-medium shadow-sm transition disabled:opacity-50 ${c.bg} ${c.border} ${c.text} hover:brightness-95`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} aria-hidden />
                    <span className="flex-1 truncate">{label}</span>
                    {showFormalLabels && obj?.formalLabel && (
                      <span className="rounded bg-white/70 px-1 font-mono text-[10px] text-slate-600">
                        {obj.formalLabel}
                      </span>
                    )}
                    <Plus className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-70" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {morphismIds.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Arrows</p>
          <ul className="space-y-1.5">
            {morphismIds.map((id) => {
              const mor = getMorphism(diagram, id);
              const label = mor?.labels[theme] ?? id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={locked}
                    data-testid={`tray-morphism-${id}`}
                    onClick={() => onPlace('morphism', id)}
                    className="group flex w-full items-start gap-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Cog className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                        {showFormalLabels && mor?.formalLabel && (
                          <span className="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-600">
                            {mor.formalLabel}
                          </span>
                        )}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {signature(diagram, theme, id, showFormalLabels)}
                      </span>
                      {mor?.description?.[theme] && (
                        <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                          {mor.description[theme]}
                        </span>
                      )}
                    </span>
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-70" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
