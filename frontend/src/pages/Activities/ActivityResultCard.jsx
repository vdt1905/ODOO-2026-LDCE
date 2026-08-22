import { Clock, MapPin, Star } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ACTIVITY_TYPE_META, gradientFor } from '../../lib/constants.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { Badge } from '../../components/ui/index.js';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

export const ActivityResultCard = ({ activity }) => {
  const meta = ACTIVITY_TYPE_META[activity.type];
  const city = activity.city;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong">
      <div className="relative aspect-[16/9] overflow-hidden">
        {activity.imageUrl ? (
          <img
            src={activity.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Almost every catalog row ships with imageUrl: '' — the type emoji on
          // a deterministic gradient gives the card a face instead of a void.
          <div
            className={cn(
              'absolute inset-0 grid place-items-center bg-gradient-to-br transition-transform duration-500 group-hover:scale-105',
              gradientFor(activity.name)
            )}
          >
            <ActivityIcon type={activity.type} className="size-9 text-white/85" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-ink-900/25" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge tone="glass">{meta?.label || activity.type}</Badge>
          <Badge tone="glass" className="whitespace-nowrap">
            <Star className="size-3 fill-current" aria-hidden />
            <span className="sr-only">Rated </span>
            {(activity.rating ?? 0).toFixed(1)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="line-clamp-2 font-display text-[17px] leading-tight text-ink-900 uppercase">
          {activity.name}
        </h3>

        {city && (
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {city.name} · {city.country}
            </span>
          </p>
        )}

        {activity.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-700">
            {activity.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3.5">
          {/* The list endpoint populates the city with name/country/region only,
              so there is no local currency to format against — USD is the app
              default and the honest fallback. Money gets the display face: it is
              the figure people scan a catalog for. */}
          <span className="font-display text-xl leading-none text-ink-900">
            {activity.cost > 0 ? formatCurrency(activity.cost) : 'Free'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-500">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(activity.durationMinutes)}
          </span>
        </div>
      </div>
    </article>
  );
};

export const ActivityResultCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface">
    <div className="aspect-[16/9] animate-pulse bg-canvas-deep" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-full animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <div className="h-4 w-16 animate-pulse rounded-full bg-canvas-deep" />
        <div className="h-3 w-12 animate-pulse rounded-full bg-canvas-deep" />
      </div>
    </div>
  </div>
);
