import { cn } from '../../lib/cn.js';

/**
 * The third state every list owes the user, next to loading and error.
 * A section that renders nothing reads as a broken app; this one explains
 * itself and offers the next step.
 *
 * Three slots, in the order the eye takes them: something to look at
 * (`illustration`, or an `icon` in a tile), an Anton headline that names the
 * situation, and a plain-English line saying what to do — then the button that
 * does it. Give it a real action wherever there is one; "No results" on its
 * own is a dead end.
 */
export const EmptyState = ({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-inset/70 text-center',
      compact ? 'px-6 py-12' : 'px-6 py-16 sm:py-20',
      className
    )}
  >
    {illustration ? (
      <div className="mb-6 w-full max-w-xs">{illustration}</div>
    ) : (
      Icon && (
        <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-line bg-surface text-brand-500">
          <Icon className="size-6" aria-hidden />
        </span>
      )
    )}

    <h3
      className={cn(
        'font-display leading-tight text-ink-900 uppercase',
        compact ? 'text-lg' : 'text-xl sm:text-2xl'
      )}
    >
      {title}
    </h3>

    {description && (
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
    )}

    {(action || secondaryAction) && (
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {action}
        {secondaryAction}
      </div>
    )}
  </div>
);
