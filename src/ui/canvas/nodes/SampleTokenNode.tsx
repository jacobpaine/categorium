/**
 * SampleTokenNode — a non-interactive token that animates along the solved path after Run,
 * carrying the value flowing through the machines (e.g. "messy spreadsheet" → "Clean Table").
 * It is never part of the validated graph; PuzzleCanvas keeps it in separate state.
 */
import { Sparkles } from 'lucide-react';
import type { NodeProps } from 'reactflow';

export const SAMPLE_TOKEN_TYPE = 'sampleToken';
export const SAMPLE_TOKEN_ID = '__sample-token__';

export type SampleTokenData = { label: string; done?: boolean };

export function SampleTokenNode({ data }: NodeProps<SampleTokenData>) {
  return (
    <div
      className={`pointer-events-none flex items-center gap-1 whitespace-nowrap rounded-full border border-indigo-300 bg-indigo-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg ${
        data.done ? 'sample-token-done' : ''
      }`}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      <span>{data.label}</span>
    </div>
  );
}
