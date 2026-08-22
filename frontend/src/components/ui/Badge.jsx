import { cn } from '../../lib/cn.js';

/**
 * Every tone carries a border as well as a fill. On a white card the fills are
 * quiet enough to disappear on their own, and on a photograph the 1px edge is
 * what keeps the pill from dissolving into the picture.
 *
 * `glass` sits on photography: a dark scrim rather than a white one, because
 * white-on-white/20 is unreadable the moment the image behind it is bright.
 */
const TONES = {
  brand: 'border-brand-100 bg-brand-50 text-brand-600',
  ember: 'border-ember-100 bg-ember-50 text-ember-700',
  moss: 'border-moss-100 bg-moss-100 text-moss-800',
  neutral: 'border-line bg-canvas-deep text-ink-700',
  outline: 'border-line-strong bg-surface/70 text-ink-700',
  glass: 'border-white/30 bg-black/30 text-white backdrop-blur-md',
  dark: 'border-ink-900 bg-ink-900 text-canvas',
};

/** Aliases so intent reads at the call site. */
TONES.success = TONES.brand;
TONES.warn = TONES.ember;
TONES.draft = TONES.ember;

const SIZES = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
};

/** Small status pill. Sentence case, Poppins 600 — a label, never a heading. */
export const Badge = ({ tone = 'neutral', size = 'md', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-sans font-semibold',
      'leading-none whitespace-nowrap [&>svg]:shrink-0',
      TONES[tone] || TONES.neutral,
      SIZES[size] || SIZES.md,
      className
    )}
    {...props}
  >
    {children}
  </span>
);
