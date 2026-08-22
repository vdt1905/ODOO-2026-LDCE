import { cn } from '../../lib/cn.js';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  ember: 'bg-ember-50 text-ember-700',
  moss: 'bg-moss-100 text-moss-800',
  neutral: 'bg-canvas-deep text-ink-700',
  glass: 'bg-white/20 text-white backdrop-blur-md border border-white/25',
  outline: 'border border-line text-ink-700',
};

export const Badge = ({ tone = 'neutral', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
      TONES[tone],
      className
    )}
    {...props}
  >
    {children}
  </span>
);
