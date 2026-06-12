/**
 * ObjectTerminal — the game-UI rendering of a domain object node (a "type" / start / goal).
 * Pill-shaped; shows a Start/Goal badge and, once the concept is unlocked, the formal label.
 */
import { Handle, Position, type NodeProps } from 'reactflow';
import { Flag, Target } from 'lucide-react';
import type { ObjectNodeData } from '../../../flow/adapter';
import { colorClasses } from '../colors';

export function ObjectTerminalNode({ data }: NodeProps<ObjectNodeData>) {
  const c = colorClasses(data.colorToken);
  const isStart = data.role === 'start';
  const isGoal = data.role === 'goal';

  return (
    <div
      className={`relative rounded-full border-2 px-5 py-3 shadow-sm ${c.bg} ${c.border} ${c.text}`}
      title={data.description}
    >
      {/* Goal objects accept an incoming wire on the left. */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          className={`!h-3 !w-3 !border-2 !border-white ${c.dot}`}
        />
      )}

      <div className="flex items-center gap-2">
        {isStart && <Flag className="h-3.5 w-3.5 opacity-70" aria-hidden />}
        {isGoal && <Target className="h-3.5 w-3.5 opacity-70" aria-hidden />}
        <span className="text-sm font-semibold">{data.label}</span>
        {data.showFormal && data.formalLabel && (
          <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs text-slate-600">
            {data.formalLabel}
          </span>
        )}
      </div>
      {(isStart || isGoal) && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {isStart ? 'Start' : 'Goal'}
        </span>
      )}

      {/* Start objects emit an outgoing wire on the right. */}
      {!isGoal && (
        <Handle
          type="source"
          position={Position.Right}
          className={`!h-3 !w-3 !border-2 !border-white ${c.dot}`}
        />
      )}
    </div>
  );
}
