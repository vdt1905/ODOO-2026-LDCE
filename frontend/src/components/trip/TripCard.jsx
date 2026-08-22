import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Moon, Trash2, Wallet } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ROUTES, TRIP_STATUS_META, gradientFor } from '../../lib/constants.js';
import { formatDateRange, relativeDayLabel } from '../../lib/dates.js';
import { formatCurrency, listNames, pluralise } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';

/**
 * How far the trip is through its budget. Returns null when no ceiling was set,
 * which is the common case — most people plan first and budget later.
 */
const budgetUse = (trip) => {
  if (!trip.budgetLimit || trip.budgetLimit <= 0) return null;
  const ratio = trip.estimatedTotal / trip.budgetLimit;
  return { ratio, percent: Math.min(100, Math.round(ratio * 100)), over: ratio > 1 };
};

/**
 * One trip on the dashboard and, later, on My Trips.
 *
 * The whole card is a link to the itinerary; Delete sits outside that link as
 * its own button, because nesting a button inside an anchor is invalid HTML and
 * makes keyboard navigation ambiguous.
 */
export const TripCard = ({ trip, onDelete, highlighted = false, className }) => {
  const meta = TRIP_STATUS_META[trip.status] || TRIP_STATUS_META.upcoming;
  const budget = budgetUse(trip);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border bg-surface shadow-soft',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
        highlighted ? 'border-brand-400 ring-4 ring-brand-500/15' : 'border-line',
        className
      )}
    >
      {/* Cover */}
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
              gradientFor(trip.name + (trip.cityNames?.[0] || ''))
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge tone="glass">{meta.label}</Badge>
          {trip.status === 'upcoming' && (
            <Badge tone="glass" className="whitespace-nowrap">
              {relativeDayLabel(trip.startDate)}
            </Badge>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="truncate font-display text-lg font-semibold text-white">{trip.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex items-start gap-1.5 text-sm text-ink-700">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-300" aria-hidden />
          <span className="line-clamp-2">
            {trip.stopCount > 0 ? listNames(trip.cityNames) : 'No cities yet'}
          </span>
        </p>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            <dt className="sr-only">Destinations</dt>
            <dd>{pluralise(trip.stopCount, 'city', 'cities')}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon className="size-3.5" aria-hidden />
            <dt className="sr-only">Nights</dt>
            <dd>{pluralise(trip.nights, 'night')}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="size-3.5" aria-hidden />
            <dt className="sr-only">Estimated cost</dt>
            <dd className="font-medium text-ink-900">
              {formatCurrency(trip.estimatedTotal, trip.currency, { compact: true })}
            </dd>
          </div>
        </dl>

        {budget && (
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={budget.over ? 'font-medium text-brand-600' : 'text-ink-500'}>
                {budget.over ? 'Over budget' : `${budget.percent}% of budget`}
              </span>
              <span className="text-ink-500">
                {formatCurrency(trip.budgetLimit, trip.currency, { compact: true })}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-500',
                  budget.over ? 'bg-brand-500' : 'bg-moss-500'
                )}
                style={{ width: `${Math.max(budget.percent, 2)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {/* Stretched link: the card is one big target, but Delete sits above
              it in the stacking order so it stays independently clickable. */}
          <Link
            to={ROUTES.trip(trip._id)}
            className="text-sm font-medium text-brand-600 transition-colors before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
          >
            Open itinerary
          </Link>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(trip)}
              aria-label={`Delete ${trip.name}`}
              className="relative z-10 grid size-9 place-items-center rounded-full text-ink-300 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export const TripCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
    <div className="aspect-[16/9] animate-pulse bg-canvas-deep" />
    <div className="space-y-3 p-4">
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-1.5 w-full animate-pulse rounded-full bg-canvas-deep" />
    </div>
  </div>
);
