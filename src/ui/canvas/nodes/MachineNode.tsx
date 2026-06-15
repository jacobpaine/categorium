/**
 * MachineNode — the game-UI rendering of a domain morphism node. Rectangular process box with
 * an input port (left, colored by source type) and an output port (right, colored by target
 * type). Shows the formal label once the morphism concept is unlocked.
 */
import { Handle, Position, type NodeProps } from 'reactflow';
import { Cog, X } from 'lucide-react';
import type { MachineNodeData } from '../../../flow/adapter';
import { colorClasses } from '../colors';
import { NodeHoverCard } from './NodeHoverCard';

/** Type signature for the hover-card: prefer formal labels (A → B), else theme labels. */
function signatureOf(data: MachineNodeData): string | undefined {
  const from = data.sourceFormal ?? data.sourceLabel;
  const to = data.targetFormal ?? data.targetLabel;
  return from && to ? `${from} → ${to}` : undefined;
}

export function MachineNode({ data }: NodeProps<MachineNodeData>) {
  const input = colorClasses(data.inputColorToken);
  const output = colorClasses(data.outputColorToken);

  return (
    <div
      data-testid={`node-machine-${data.morphismId}`}
      className="group relative rounded-lg border-2 border-slate-400 bg-white px-5 py-3 shadow-sm"
    >
      <NodeHoverCard
        name={data.label}
        role="process"
        formalLabel={data.formalLabel}
        signature={signatureOf(data)}
        description={data.description}
      />
      {data.removable && (
        <button
          type="button"
          aria-label={`Return ${data.label} to the tray`}
          data-testid={`remove-machine-${data.morphismId}`}
          onClick={(e) => {
            e.stopPropagation();
            data.onRemove?.();
          }}
          className="absolute -right-2 -top-2 z-10 hidden rounded-full bg-slate-700 p-0.5 text-white shadow group-hover:block hover:bg-slate-900"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3 !w-3 !border-2 !border-white ${input.dot}`}
      />

      <div className="flex items-center gap-2 text-slate-800">
        <Cog className="h-4 w-4 opacity-70" aria-hidden />
        <span className="text-sm font-semibold">{data.label}</span>
        {data.showFormal && data.formalLabel && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
            {data.formalLabel}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3 !w-3 !border-2 !border-white ${output.dot}`}
      />
    </div>
  );
}
