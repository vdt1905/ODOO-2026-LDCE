import { ArrowRight, Bookmark, MapPin } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { gradientFor } from '../../lib/constants.js';
import { Badge } from '../../components/ui/index.js';
import { CityMetric } from '../../components/landing/CityCard.jsx';
import { costLabel, popularityLabel } from '../../components/landing/cityLabels.js';

/**
 * One city in the search results — the roomy member of the destination card
 * family. Shares its metric unit with `CityCard` so the compact tile on the
 * dashboard and this one cannot drift apart.
 *
 * The photograph holds a fixed 16:11 crop and carries only two controls: the
 * region tag and the save toggle. Everything readable lives on the white panel
 * underneath, which is what separates this from the gradient-scrim card every
 * other travel site ships.
 *
 * The heading sits outside the button and the button stretches over the whole
 * card instead — a <button> may only contain phrasing content, so wrapping the
 * <h3> in one would be invalid markup for the sake of a click target.
 */
export const CityResultCard = ({ city, onOpen, isSaved = false, saving = false, onToggleSave }) => {
  const costIndex = city.costIndex ?? 50;
  const popularity = city.popularity ?? 50;

  return (
    <article
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-line bg-surface',
        'transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong'
      )}
    >
      <div className="relative aspect-16/11 overflow-hidden border-b border-line bg-canvas-deep">
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

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-[22px] leading-[0.95] text-ink-900 uppercase">
            {city.name}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{city.country}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CityMetric label="Cost" value={costIndex} hint={costLabel(costIndex)} />
          <CityMetric
            label="Popularity"
            value={popularity}
            hint={popularityLabel(popularity)}
            tone="ember"
          />
        </div>

        <button
          type="button"
          onClick={() => onOpen(city)}
          aria-label={`${city.name}, ${city.country} — details and things to do`}
          className={cn(
            'mt-auto flex cursor-pointer items-center justify-between gap-2 border-t border-line-soft pt-4',
            'text-left text-sm font-semibold text-brand-600 transition-colors duration-300',
            "before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
          )}
        >
          See what&apos;s there
          <ArrowRight
            className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </button>
      </div>
    </article>
  );
};

/**
 * Same silhouette as the real card — 16:11 photo block, panel, two metric
 * columns, action row — so the results grid does not jump when data lands.
 */
export const CityResultCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface" aria-hidden>
    <div className="aspect-16/11 animate-pulse border-b border-line bg-canvas-deep" />

    <div className="p-5">
      <div className="h-5 w-2/3 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />

      <div className="mt-5 grid grid-cols-2 gap-4">
        {[0, 1].map((column) => (
          <div key={column}>
            <div className="h-2 w-10 animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-4 w-12 animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-[3px] w-full animate-pulse rounded-full bg-canvas-deep" />
            <div className="mt-2 h-2 w-12 animate-pulse rounded-full bg-canvas-deep" />
          </div>
        ))}
      </div>

      <div className="mt-5 h-4 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
    </div>
  </div>
);
