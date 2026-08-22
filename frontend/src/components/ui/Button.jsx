import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Fills, in the order you should reach for them.
 *
 * `primary` is the only colour that says "do the main thing here" — one per
 * screen. `ember` is destructive/over-budget intent and never a primary
 * action. `glass` is for photographic grounds only, where a solid pill would
 * punch a hole in the image.
 */
const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-soft',
  dark: 'bg-ink-900 text-canvas hover:bg-ink-700 active:bg-ink-900 shadow-soft',
  light: 'bg-surface text-ink-900 hover:bg-canvas active:bg-canvas-deep shadow-pill',
  outline:
    'border border-line-strong bg-surface/60 text-ink-900 hover:border-ink-300 hover:bg-canvas-deep active:bg-line',
  subtle: 'bg-canvas-deep text-ink-900 hover:bg-line active:bg-line-strong',
  ghost: 'bg-transparent text-ink-700 hover:bg-canvas-deep hover:text-ink-900 active:bg-line',
  ember: 'bg-ember-500 text-white hover:bg-ember-700 active:bg-ember-700 shadow-soft',
  glass:
    'bg-white/15 text-white backdrop-blur-md border border-white/30 hover:bg-white/25 active:bg-white/30',
};

/** `danger` reads better at some call sites; it is the same pill as `ember`. */
VARIANTS.danger = VARIANTS.ember;

/**
 * Heights match `controlClasses` exactly (9 / 10 / 11) so a button dropped next
 * to an input or select lines up on its own. Change one ladder and you must
 * change the other.
 *
 * The gap lives here rather than in the base string: clsx does not merge
 * Tailwind classes, so two `gap-*` on one element would let the stylesheet
 * pick the winner instead of us.
 */
const SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-6 text-[15px]',
};

/**
 * One button for the whole app. Renders as <button>, <Link> (`to`) or <a> (`href`)
 * so navigation and actions stay visually identical.
 *
 * The label is always Poppins 600 — an explicit `font-sans` so a button sitting
 * inside an Anton heading block does not inherit the display face.
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
    // rounded-lg, not a pill. The pill was reading as a mobile app button; on a
    // dense planning screen the squarer corner is what makes a toolbar of six
    // controls look like one instrument instead of six lozenges.
    'inline-flex shrink-0 items-center justify-center rounded-lg whitespace-nowrap',
    'font-sans font-semibold tracking-[0.01em]',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
    'active:scale-[0.98] [&>svg]:shrink-0',
    // A disabled control has to look inert, not just faint: the fill loses its
    // colour as well as its weight, and every hover/press affordance is off.
    'disabled:pointer-events-none disabled:opacity-45 disabled:saturate-50 disabled:shadow-none',
    'aria-disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:saturate-50',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
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
