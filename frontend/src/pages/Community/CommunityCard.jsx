import { Link } from 'react-router-dom';
import { CalendarDays, Eye, MapPin, Sparkles, Wallet } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ROUTES, gradientFor } from '../../lib/constants.js';
import { formatDateRange } from '../../lib/dates.js';
import { formatCurrency, formatNumber, listNames, pluralise } from '../../lib/format.js';
import { Avatar, Badge } from '../../components/ui/index.js';

/**
 * One published itinerary in the feed.
 *
 * Feed rows carry no `_id` — the API only exposes `publicSlug`, so that is both
 * the React key and the link target, and the numeric trip id never leaves the
 * detail endpoint.
 */
export const CommunityCard = ({ trip }) => {
  const home = [trip.owner?.city, trip.owner?.country].filter(Boolean).join(', ');

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/9] overflow-hidden">
        {trip.coverPhotoUrl ? (
          <img
            src={trip.coverPhotoUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105',
              gradientFor(trip.name + (trip.cities?.[0] || ''))
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex justify-end p-3">
          <Badge tone="glass" className="whitespace-nowrap">
            <Eye className="size-3.5" aria-hidden />
            {formatNumber(trip.viewCount)}
            <span className="sr-only">views</span>
          </Badge>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="truncate font-display text-lg font-semibold text-white">{trip.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex items-start gap-1.5 text-sm text-ink-700">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-300" aria-hidden />
          <span className="line-clamp-2">
            {trip.cities?.length ? listNames(trip.cities) : 'No cities listed'}
          </span>
        </p>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            <dt className="sr-only">Stops</dt>
            <dd>{pluralise(trip.stopCount, 'stop')}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden />
            <dt className="sr-only">Activities</dt>
            <dd>{pluralise(trip.activityCount, 'activity', 'activities')}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="size-3.5" aria-hidden />
            {/* "from", never "total": the feed's estimate leaves meals out. */}
            <dt className="sr-only">Estimated cost, meals excluded</dt>
            <dd className="font-medium text-ink-900">
              from {formatCurrency(trip.estimatedCost, trip.currency, { compact: true })}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar user={trip.owner} size="size-8" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{trip.owner?.firstName}</p>
              {home && <p className="truncate text-xs text-ink-500">{home}</p>}
            </div>
          </div>

          {/* Stretched link — the whole card is the target, and nothing else
              inside it is interactive, so no z-index juggling is needed. */}
          <Link
            to={ROUTES.publicTrip(trip.publicSlug)}
            className="shrink-0 text-sm font-medium text-brand-600 transition-colors before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
          >
            View trip
            <span className="sr-only"> — {trip.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export const CommunityCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
    <div className="aspect-[16/9] animate-pulse bg-canvas-deep" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-8 w-2/3 animate-pulse rounded-full bg-canvas-deep" />
    </div>
  </div>
);
