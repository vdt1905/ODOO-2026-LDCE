import { MapPin } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { gradientFor } from '../../lib/constants.js';
import { Badge } from '../../components/ui/index.js';

/** A 1–100 index, drawn as a bar because it is a position on a scale, not money. */
const Meter = ({ label, value }) => (
  <div>
    <div className="flex items-baseline justify-between text-[11px]">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}/100</span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
      <div
        className="h-full rounded-full bg-brand-400"
        style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
      />
    </div>
  </div>
);

/**
 * One city in the search results.
 *
 * The heading sits outside the button and the button stretches over the whole
 * card instead — a <button> may only contain phrasing content, so wrapping the
 * <h3> in one would be invalid markup for the sake of a click target.
 */
export const CityResultCard = ({ city, onOpen }) => {
  const costIndex = city.costIndex ?? 50;
  const popularity = city.popularity ?? 50;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        {city.imageUrl ? (
          <img
            src={city.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105',
              gradientFor(city.name + city.country)
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />

        <div className="absolute inset-x-0 top-0 p-3">
          <Badge tone="glass">{city.region}</Badge>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="truncate font-display text-lg font-semibold text-white">{city.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {city.country}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Meter label="Cost" value={costIndex} />
        <Meter label="Popularity" value={popularity} />

        <button
          type="button"
          onClick={() => onOpen(city)}
          aria-label={`${city.name}, ${city.country} — details and things to do`}
          className="mt-auto pt-1 text-left text-sm font-medium text-brand-600 transition-colors before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
        >
          See what&apos;s there
        </button>
      </div>
    </article>
  );
};

export const CityResultCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface">
    <div className="aspect-[16/10] animate-pulse bg-canvas-deep" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-1/3 animate-pulse rounded-full bg-canvas-deep" />
    </div>
  </div>
);
