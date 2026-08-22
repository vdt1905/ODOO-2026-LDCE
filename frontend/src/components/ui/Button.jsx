import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  primary: 'bg-clay-500 text-white hover:bg-clay-600 shadow-soft',
  dark: 'bg-ink-900 text-canvas hover:bg-ink-700 shadow-soft',
  light: 'bg-surface text-ink-900 hover:bg-canvas shadow-pill',
  outline: 'border border-line bg-transparent text-ink-900 hover:bg-canvas-deep',
  ghost: 'bg-transparent text-ink-700 hover:bg-canvas-deep',
  glass: 'bg-white/15 text-white backdrop-blur-md border border-white/30 hover:bg-white/25',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

/**
 * One button for the whole app. Renders as <button>, <Link> (`to`) or <a> (`href`)
 * so navigation and actions stay visually identical.
 */
export const Button = ({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) => {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium',
    'transition-all duration-200 active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  const Tag = as || 'button';
  return (
    <Tag className={classes} disabled={disabled || loading} {...props}>
      {content}
    </Tag>
  );
};
