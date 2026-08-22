import { cn } from '../../lib/cn.js';

/**
 * The third state every list owes the user, next to loading and error.
 * A section that renders nothing reads as a broken app; this one explains
 * itself and offers the next step.
 */
export const EmptyState = ({ icon: Icon, title, description, action, className, compact = false }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/60 text-center',
      compact ? 'px-6 py-10' : 'px-6 py-16',
      className
    )}
  >
    {Icon && (
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-5" aria-hidden />
      </span>
    )}

    <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
