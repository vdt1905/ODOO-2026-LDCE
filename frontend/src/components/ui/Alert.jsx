import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Ember is failure, brand is confirmation. The old error tone was brand-green,
 * which read as "saved" at a glance and said the opposite of what it meant.
 *
 * `chip` is the little square the icon sits in — it is what gives the banner a
 * clear icon → title → body ladder instead of three things at one weight.
 */
const TONES = {
  error: {
    wrap: 'border-ember-100 bg-ember-50 text-ember-700',
    chip: 'bg-ember-100 text-ember-700',
    Icon: AlertCircle,
  },
  warning: {
    wrap: 'border-ember-100 bg-ember-50/60 text-ember-700',
    chip: 'bg-ember-100 text-ember-700',
    Icon: AlertTriangle,
  },
  success: {
    wrap: 'border-brand-100 bg-brand-50 text-brand-700',
    chip: 'bg-brand-100 text-brand-600',
    Icon: CheckCircle2,
  },
  info: {
    wrap: 'border-line bg-inset text-ink-700',
    chip: 'bg-brand-50 text-brand-500',
    Icon: Info,
  },
};

/** `neutral` is the same quiet paper banner as `info`. */
TONES.neutral = TONES.info;

/**
 * Inline banner for form-level failures and confirmations.
 *
 * `title` is Anton — short, uppercase, one line: "Your trips could not be
 * loaded". The body underneath is Poppins and says what to do about it.
 * `action` parks a retry button on the right.
 */
export const Alert = ({ tone = 'error', title, icon, action, children, className, ...props }) => {
  const { wrap, chip, Icon: FallbackIcon } = TONES[tone] || TONES.info;
  const Icon = icon || FallbackIcon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-2xl border p-4', wrap, className)}
      {...props}
    >
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', chip)}>
        <Icon className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-display text-[15px] leading-tight uppercase">{title}</p>}
        {children && (
          <div className="text-sm leading-relaxed font-normal opacity-90">{children}</div>
        )}
      </div>

      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};
