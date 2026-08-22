import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export const Spinner = ({ className }) => (
  <Loader2 className={cn('size-5 animate-spin text-brand-500', className)} aria-hidden />
);

/**
 * A loading placeholder shaped like the thing that is coming.
 *
 * Prefer this over a spinner anywhere a grid, a table row or a stat tile is
 * about to appear: the page keeps its geometry, so nothing jumps when the data
 * lands. Pass the real element's size/radius through `className`.
 */
export const Skeleton = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn('animate-pulse rounded-xl bg-canvas-deep', className)}
    {...props}
  />
);

/** Full-viewport loader used while the session is being restored on boot. */
export const FullPageLoader = ({ label = 'Loading' }) => (
  <div className="grid min-h-screen place-items-center bg-canvas">
    <div className="flex flex-col items-center gap-3">
      <Spinner className="size-7" />
      <p className="text-sm text-ink-500">{label}…</p>
    </div>
  </div>
);
