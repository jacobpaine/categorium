/**
 * Maps a domain `colorToken` to Tailwind utility classes. Presentation only — keeps color
 * decisions out of the domain and adapter.
 */
type ColorClasses = { bg: string; border: string; text: string; dot: string };

const PALETTE: Record<string, ColorClasses> = {
  sky: { bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-900', dot: 'bg-sky-400' },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-900',
    dot: 'bg-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-900',
    dot: 'bg-amber-400',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-900',
    dot: 'bg-violet-400',
  },
  rose: { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', dot: 'bg-rose-400' },
};

const FALLBACK: ColorClasses = {
  bg: 'bg-slate-50',
  border: 'border-slate-400',
  text: 'text-slate-900',
  dot: 'bg-slate-400',
};

export function colorClasses(token?: string): ColorClasses {
  return (token && PALETTE[token]) || FALLBACK;
}
