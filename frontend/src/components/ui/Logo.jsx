import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';

const Mark = ({ className }) => (
  <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
    <circle cx="16" cy="16" r="14" className="fill-clay-500" />
    <path
      d="M2.6 16h26.8M16 2.2c3.6 3.7 5.6 8.6 5.6 13.8S19.6 26.1 16 29.8c-3.6-3.7-5.6-8.6-5.6-13.8S12.4 5.9 16 2.2Z"
      className="stroke-white/70"
      strokeWidth="1.6"
      fill="none"
    />
    <circle cx="21.5" cy="11" r="3" className="fill-moss-300" />
  </svg>
);

export const Logo = ({ to = ROUTES.landing, className, tone = 'ink' }) => (
  <Link to={to} className={cn('inline-flex items-center gap-2', className)}>
    <Mark />
    <span
      className={cn(
        'font-display text-lg font-bold tracking-tight',
        tone === 'light' ? 'text-white' : 'text-ink-900'
      )}
    >
      GlobeTrotter
    </span>
  </Link>
);
