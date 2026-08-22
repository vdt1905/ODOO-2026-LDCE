import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export const Spinner = ({ className }) => (
  <Loader2 className={cn('size-5 animate-spin text-brand-500', className)} aria-hidden />
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
