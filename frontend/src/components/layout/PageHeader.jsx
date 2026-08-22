import { Link } from 'react-router-dom';

import { cn } from '../../lib/cn.js';
import { useImmersiveHeader } from './chrome.jsx';

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
 */
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

      {/* Dark at the top for the nav, dark at the foot for the title, open in
          the middle so the photograph is still doing something. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,22,18,0.74) 0%, rgba(18,22,18,0.30) 38%, rgba(18,22,18,0.86) 100%)',
        }}
      />

      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-28 pb-9 sm:px-6',
          align === 'center' ? 'justify-center text-center' : 'justify-end'
        )}
      >
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex animate-fade-up flex-wrap items-center gap-1.5 text-xs font-bold text-white/70"
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

            <h1
              className={cn(
                'delay-2 mt-2.5 animate-fade-up font-display-caps text-white drop-shadow-[0_2px_18px_rgba(18,22,18,0.5)]',
                size === 'lg'
                  ? 'text-[clamp(34px,6vw,76px)] leading-[0.94]'
                  : 'text-[clamp(27px,3.8vw,46px)] leading-none'
              )}
            >
              {title}
            </h1>

            {sub && (
              <p className="delay-3 mt-3 max-w-2xl animate-fade-up text-sm font-medium text-white/80">
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
