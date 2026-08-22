import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const TONES = {
  error: { wrap: 'bg-clay-50 border-clay-200 text-clay-700', Icon: AlertCircle },
  success: { wrap: 'bg-moss-50 border-moss-100 text-moss-800', Icon: CheckCircle2 },
  info: { wrap: 'bg-canvas-deep border-line text-ink-700', Icon: Info },
};

/** Inline banner for form-level failures and confirmations. */
export const Alert = ({ tone = 'error', title, children, className }) => {
  const { wrap, Icon } = TONES[tone] || TONES.info;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-2xl border px-4 py-3 text-sm', wrap, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
};
