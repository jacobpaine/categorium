/**
 * FunctorChipNode — a single object or morphism of a category, shown as a chip in the functor
 * mapping puzzle. Source-side chips expose a right (source) handle; target-side chips a left
 * (target) handle, so the player draws mapping edges from source category to target category.
 */
import { Handle, Position, type NodeProps } from 'reactflow';
import { colorClasses } from '../colors';
import { NodeHoverCard } from './NodeHoverCard';

export type FunctorChipData = {
  side: 'source' | 'target';
  kind: 'object' | 'morphism';
  /** The object/morphism id this chip stands for. */
  refId: string;
  label: string;
  /** For morphisms: the "A → B" endpoint hint. */
  sub?: string;
  /** One-line, theme-flavored "what this is", shown on hover. */
  description?: string;
  colorToken?: string;
};

export function FunctorChipNode({ data }: NodeProps<FunctorChipData>) {
  const isObject = data.kind === 'object';
  const c = colorClasses(data.colorToken);

  const body = isObject ? (
    <div className={`rounded-2xl border-2 px-4 py-2 shadow-sm ${c.bg} ${c.border} ${c.text}`}>
      <div className="text-sm font-semibold">{data.label}</div>
      {data.sub && <div className="font-mono text-[11px] opacity-70">{data.sub}</div>}
    </div>
  ) : (
    <div className="rounded-lg border-2 border-slate-400 bg-white px-3 py-1.5 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">{data.label}</div>
      {data.sub && <div className="font-mono text-[11px] text-slate-500">{data.sub}</div>}
    </div>
  );

  return (
    // pointer-events-auto: the NT chips are non-draggable, so React Flow would otherwise leave the
    // node non-interactive and the hover-card would never trigger.
    <div className="group relative pointer-events-auto">
      <NodeHoverCard
        name={data.label}
        role={isObject ? 'object' : 'process'}
        signature={data.sub}
        description={data.description}
        placement="bottom"
      />
      {data.side === 'target' && (
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-indigo-500" />
      )}
      {body}
      {data.side === 'source' && (
        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-indigo-500" />
      )}
    </div>
  );
}
