/**
 * MachineNode — the game-UI rendering of a domain morphism node. Rectangular process box with
 * an input port (left, colored by source type) and an output port (right, colored by target
 * type). Shows the formal label once the morphism concept is unlocked.
 */
import { Handle, Position, type NodeProps } from 'reactflow';
import { Cog } from 'lucide-react';
import type { MachineNodeData } from '../../../flow/adapter';
import { colorClasses } from '../colors';

export function MachineNode({ data }: NodeProps<MachineNodeData>) {
  const input = colorClasses(data.inputColorToken);
  const output = colorClasses(data.outputColorToken);

  return (
    <div
      className="relative rounded-lg border-2 border-slate-400 bg-white px-5 py-3 shadow-sm"
      title={data.description}
    >
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
