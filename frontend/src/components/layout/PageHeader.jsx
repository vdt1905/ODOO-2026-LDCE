import { Link } from 'react-router-dom';

import { cn } from '../../lib/cn.js';
import { useImmersiveHeader } from './chromeContext.js';

/**
 * The masthead every signed-in screen opens with.
 *
 * Structurally this is the point of the component: the photo is the *container*
 * and the navbar sits inside it, so the image reads as the background of the
 * top bar rather than a separate band beneath it. The earlier treatment was a
 * 150–210px strip below an opaque nav — a ~7:1 letterbox that looked like a
 * YouTube channel banner and left a bare cream bar behind once you scrolled.
 *
 * Two things make it work:
 *   · `pt-28` clears the fixed navbar, and the image runs up underneath it.
 *   · The gradient is dark at BOTH ends — the top stop exists purely so white
 *     nav links stay legible on a pale photo, the bottom stop for the title.
 *     A single bottom-weighted scrim leaves the nav unreadable over sky.
 *
 * The top stop carries more weight than it used to: the navbar now has no
 * backdrop of its own at all, so this gradient is the ONLY thing standing
 * between white nav links and whatever the photograph happens to be doing.
 *
 * The inner wrapper is on the shared `.shell` measure, so the title lines up
 * with the first <Section> of the page rather than sitting on its own margin.
 */

/** Dark for the nav, open through the middle, dark again for the title. */
const SCRIM =
  'linear-gradient(180deg,' +
  ' rgba(14,18,14,0.86) 0%,' +
  ' rgba(14,18,14,0.60) 16%,' +
  ' rgba(14,18,14,0.28) 42%,' +
  ' rgba(14,18,14,0.62) 78%,' +
  ' rgba(14,18,14,0.90) 100%)';

export const PageHeader = ({
  image,
  kicker,
  title,
  sub,
  breadcrumb,
  actions,
  align = 'end',
  size = 'md',
  children,
}) => {
  // Tells the navbar there is a photograph beneath it, so it can go transparent.
  useImmersiveHeader();

  return (
    <header
      className={cn(
        'relative isolate flex flex-col overflow-hidden bg-brand-700',
        size === 'sm' && 'min-h-[clamp(230px,24vw,300px)]',
        size === 'md' && 'min-h-[clamp(280px,30vw,400px)]',
        size === 'lg' && 'min-h-[clamp(340px,42vw,520px)]'
      )}
    >
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 size-full object-cover"
        />
      )}

      <div className="absolute inset-0 -z-10" style={{ background: SCRIM }} />

      <div
        className={cn(
          'shell flex flex-1 flex-col pt-28 pb-10',
          align === 'center' ? 'justify-center text-center' : 'justify-end'
        )}
      >
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex animate-fade-up flex-wrap items-center gap-1.5 text-xs font-semibold text-white/70"
          >
            {breadcrumb.map((crumb, index) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-white/35">/</span>}
                {crumb.to ? (
                  <Link to={crumb.to} className="text-white/85 transition-colors hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className={cn('min-w-0', align === 'center' && 'mx-auto')}>
            {kicker && <p className="eyebrow delay-1 animate-fade-up text-brand-200">{kicker}</p>}

            {/* Anton, uppercase, pulled tight. `font-display-caps` carries the
                face and the casing; only the size and leading change per size. */}
            <h1
              className={cn(
                'delay-2 mt-3 animate-fade-up font-display-caps text-white drop-shadow-[0_2px_18px_rgba(18,22,18,0.5)]',
                size === 'lg'
                  ? 'text-[clamp(34px,6vw,76px)] leading-[0.92]'
                  : 'text-[clamp(27px,3.8vw,46px)] leading-[0.92]'
              )}
            >
              {title}
            </h1>

            {sub && (
              <p className="delay-3 mt-4 max-w-2xl animate-fade-up text-sm leading-relaxed text-white/80">
                {sub}
              </p>
            )}
          </div>

          {actions && (
            <div className="delay-3 flex animate-fade-up flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>

        {children && <div className="delay-4 mt-7 animate-fade-up">{children}</div>}
      </div>
    </header>
  );
};
