import { cn } from '../../lib/cn.js';

/**
 * The one full-width band every page is built from.
 *
 * Spacing lives in `.section` / `.shell` (index.css) rather than in per-page
 * Tailwind classes, so two screens cannot quietly disagree about how much air
 * a section gets or how wide the content runs. Before this, the landing hero
 * measured 1320px with 2rem gutters and the subpages measured 1152px with
 * 1.5rem — enough that content visibly jumped as you moved between routes.
 *
 * `tone` picks the ground the band sits on. `dark` is the inverted treatment
 * used by the closing About/Contact band.
 */
const TONES = {
  canvas: 'bg-canvas text-ink-900',
  surface: 'bg-surface text-ink-900',
  inset: 'bg-inset text-ink-900',
  deep: 'bg-canvas-deep text-ink-900',
  dark: 'bg-brand-700 text-canvas',
  none: '',
};

export const Section = ({
  as: Tag = 'section',
  tone = 'canvas',
  tight = false,
  narrow = false,
  className,
  innerClassName,
  children,
  ...props
}) => (
  <Tag className={cn(tight ? 'section-tight' : 'section', TONES[tone], className)} {...props}>
    <div className={cn(narrow ? 'shell-narrow' : 'shell', innerClassName)}>{children}</div>
  </Tag>
);

/**
 * Eyebrow · Anton title · Poppins standfirst, with an optional action parked on
 * the right. Every section opens with this so the type ladder is identical
 * across the site instead of being re-improvised per screen.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  sub,
  action,
  align = 'start',
  invert = false,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
      align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      className
    )}
  >
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
      {eyebrow && (
        <p className={cn('eyebrow', invert ? 'text-brand-200' : 'text-brand-500')}>{eyebrow}</p>
      )}
      <h2
        className={cn(
          'section-title mt-3',
          invert ? 'text-canvas' : 'text-ink-900'
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            'mt-4 text-[15px] leading-relaxed',
            invert ? 'text-canvas/70' : 'text-ink-700'
          )}
        >
          {sub}
        </p>
      )}
    </div>

    {action && <div className="shrink-0">{action}</div>}
  </div>
);
