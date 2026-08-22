import { ArrowRight, Bookmark, MapPin } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { gradientFor } from '../../lib/constants.js';
import { Badge } from '../ui/Badge.jsx';
import { costLabel, popularityLabel } from './cityLabels.js';

const TRACK_TONES = {
  brand: 'bg-brand-400',
  ember: 'bg-ember-500',
};

/**
 * One labelled figure in a card's metric row — the shared unit behind both
 * destination cards, so the two can never drift out of step.
 *
 * The number is Anton and is the largest thing in the column, because a figure
 * is what people scan a destination card for. The 3px track underneath is a
 * position on a scale, not a progress bar: it is deliberately hairline so it
 * reads as a mark rather than as something still loading.
 */
export const CityMetric = ({ label, value, hint, tone = 'brand' }) => {
  const pct = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-300 uppercase">{label}</p>

      <p className="mt-1.5 font-display text-[19px] leading-none text-ink-900">
        {pct}
        <span className="ml-0.5 font-sans text-[10px] text-ink-300">/100</span>
      </p>

      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-canvas-deep">
        <div
          className={cn('h-full rounded-full', TRACK_TONES[tone] || TRACK_TONES.brand)}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>

      {hint && <p className="mt-1.5 truncate text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
};

/**
 * Destination tile — the compact member of the card family, used in the
 * dashboard grid and the landing rail.
 *
 * Editorial split rather than the usual travel-site treatment: the photograph
 * keeps a fixed 4:3 crop at the top and carries nothing but a region pill, and
 * every piece of information sits below it on a solid white panel. Text on a
 * scrim looks the same on every travel site and survives no photograph;
 * a real panel gives the type a ground it can be read against.
 *
 * The heading lives outside the button and the button stretches over the card
 * with a `before:inset-0` pseudo-element — a <button> may only contain phrasing
 * content, so wrapping the <h3> in one would be invalid markup bought purely
 * for a click target.
 */
export const CityCard = ({
  city,
  className,
  onClick,
  actionLabel = "See what's there",
  isSaved = false,
  saving = false,
  onToggleSave,
}) => {
  const costIndex = city.costIndex ?? 50;
  const popularity = city.popularity ?? 50;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface',
        'transition-[transform,border-color] duration-300',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:border-line-strong',
        className
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden border-b border-line bg-canvas-deep">
        {city.imageUrl ? (
          <img
            src={city.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.04]',
              gradientFor(city.name + city.country)
            )}
          />
        )}

        {/* Just enough shade under the pills to keep them legible on a bright sky. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink-900/35 to-transparent" />

        {city.region && (
          <Badge tone="glass" size="sm" className="absolute top-3 left-3">
            <MapPin className="size-3" aria-hidden />
            {city.region}
          </Badge>
        )}

        {onToggleSave && (
          <button
            type="button"
            title={isSaved ? `Remove ${city.name} from saved destinations` : `Save ${city.name}`}
            aria-label={isSaved ? `Remove ${city.name} from saved destinations` : `Save ${city.name}`}
            aria-pressed={isSaved}
            disabled={saving}
            onClick={() => onToggleSave(city)}
            className={cn(
              'absolute top-3 right-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full',
              'border backdrop-blur-md transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
              isSaved
                ? 'border-white bg-white text-brand-600'
                : 'border-white/40 bg-ink-900/30 text-white hover:bg-ink-900/50'
            )}
          >
            <Bookmark className="size-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-[19px] leading-[0.95] text-ink-900 uppercase">
            {city.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{city.country}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CityMetric label="Cost" value={costIndex} hint={costLabel(costIndex)} />
          <CityMetric
            label="Popularity"
            value={popularity}
            hint={popularityLabel(popularity)}
            tone="ember"
          />
        </div>

        {onClick && (
          <button
            type="button"
            onClick={onClick}
            aria-label={`${city.name}, ${city.country} — ${actionLabel}`}
            className={cn(
              'mt-auto flex cursor-pointer items-center justify-between gap-2 border-t border-line-soft pt-3',
              'text-left text-[13px] font-semibold text-brand-600 transition-colors duration-300',
              "before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
            )}
          >
            {actionLabel}
            <ArrowRight
              className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </button>
        )}
      </div>
    </article>
  );
};

/**
 * Same silhouette as the real card — 4:3 photo block, panel, two metric
 * columns, action row — so the grid does not reflow the moment data lands.
 */
export const CityCardSkeleton = ({ className }) => (
  <div
    className={cn('overflow-hidden rounded-3xl border border-line bg-surface', className)}
    aria-hidden
  >
    <div className="aspect-4/3 animate-pulse border-b border-line bg-canvas-deep" />

    <div className="p-4 sm:p-5">
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-2.5 h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[0, 1].map((column) => (
          <div key={column}>
            <div className="h-2 w-10 animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-4 w-12 animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-[3px] w-full animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-2 w-12 animate-pulse rounded-full bg-canvas-deep" />
          </div>
        ))}
      </div>

      <div className="mt-4 h-3 w-1/2 animate-pulse rounded-full border-t border-line-soft bg-canvas-deep" />
    </div>
  </div>
);
