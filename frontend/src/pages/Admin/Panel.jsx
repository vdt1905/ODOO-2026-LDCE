import { cn } from '../../lib/cn.js';

/** The card every admin section sits in — heading, optional control, body. */
export const Panel = ({ title, description, action, className, children }) => (
  <section className={cn('rounded-3xl border border-line bg-surface p-5 sm:p-6', className)}>
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="font-display text-xl text-ink-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>

    <div className="mt-5">{children}</div>
  </section>
);

/** Stand-in rows while a panel's data is in flight — same height as the real list. */
export const RowSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-2xl bg-canvas-deep" />
    ))}
  </div>
);
