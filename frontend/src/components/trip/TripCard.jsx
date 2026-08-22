import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Trash2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ROUTES, TRIP_STATUS_META, gradientFor } from '../../lib/constants.js';
import { daysInclusive, formatDateRange, relativeDayLabel } from '../../lib/dates.js';
import { formatCurrency, pluralise } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';

/** How many city chips fit on one card before the rest collapse into "+N". */
const MAX_CHIPS = 3;

/**
 * How far the trip is through its budget. Returns null when no ceiling was set,
 * which is the common case — most people plan first and budget later.
 */
const budgetUse = (trip) => {
  if (!trip.budgetLimit || trip.budgetLimit <= 0) return null;
  const ratio = trip.estimatedCost / trip.budgetLimit;
  return { ratio, percent: Math.min(100, Math.round(ratio * 100)), over: ratio > 1 };
};

/**
 * One trip on the dashboard and on My Trips.
 *
 * Same card family as the destination tiles — fixed 16:11 photograph on top,
 * solid white information panel underneath — but the panel answers a different
 * question. A trip is read for *when* and *how much*, so the date range sits
 * directly under the name and the estimated cost is the largest figure on the
 * card, set in Anton where a number earns the display face.
 *
 * The whole card is a link to the itinerary; Delete sits above that link in the
 * stacking order as its own button, because nesting a button inside an anchor
 * is invalid HTML and makes keyboard navigation ambiguous.
 */
export const TripCard = ({ trip, onDelete, highlighted = false, className }) => {
  const meta = TRIP_STATUS_META[trip.status] || TRIP_STATUS_META.upcoming;
  const budget = budgetUse(trip);

  const cities = trip.cities || [];
  const chips = cities.slice(0, MAX_CHIPS);
  const overflow = cities.length - chips.length;
  const days = daysInclusive(trip.startDate, trip.endDate);
  const nights = trip.nights ?? Math.max(0, days - 1);

  return (
    <article
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-surface',
        'transition-[transform,border-color] duration-300 hover:-translate-y-0.5',
        highlighted
          ? 'border-brand-400 ring-2 ring-brand-500/20'
          : 'border-line hover:border-line-strong',
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-16/11 overflow-hidden border-b border-line bg-canvas-deep">
        {trip.coverPhotoUrl ? (
          <img
            src={trip.coverPhotoUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.04]',
              gradientFor(trip.name + (cities[0] || ''))
            )}
          />
        )}

        {/* Just enough shade under the pills to keep them legible on a bright sky. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink-900/35 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge tone="glass" size="sm">
            {meta.label}
          </Badge>
          {trip.status === 'upcoming' && (
            <Badge tone="glass" size="sm" className="whitespace-nowrap">
              {relativeDayLabel(trip.startDate)}
            </Badge>
          )}
        </div>
      </div>

      {/* Panel */}
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-display text-[22px] leading-[0.95] text-ink-900 uppercase">
            {trip.name}
          </h3>

          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-700">
            <CalendarDays className="size-3.5 shrink-0 text-ink-300" aria-hidden />
            <span className="truncate">{formatDateRange(trip.startDate, trip.endDate)}</span>
          </p>

          <p className="mt-1 text-[12px] text-ink-500">
            {pluralise(days, 'day')} · {pluralise(nights, 'night')} ·{' '}
            {pluralise(trip.stopCount ?? cities.length, 'city', 'cities')}
          </p>
        </div>

        {/* Where it goes. Chips beat a comma list — you can count the stops. */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-300 uppercase">
            Route
          </p>
          {chips.length > 0 ? (
            <ul className="mt-2 flex flex-wrap items-center gap-1.5">
              {chips.map((name, index) => (
                <li
                  key={`${index}-${name}`}
                  className="max-w-[140px] truncate rounded-full border border-line bg-inset px-2.5 py-1 text-[11px] text-ink-700"
                >
                  {name}
                </li>
              ))}
              {overflow > 0 && (
                <li className="rounded-full border border-line bg-inset px-2.5 py-1 text-[11px] text-ink-500">
                  +{overflow} more
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-500">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              No cities yet — open it to add the first stop
            </p>
          )}
        </div>

        {/* Money. The biggest figure on the card, because it is what gets scanned. */}
        <div className="border-t border-line-soft pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-300 uppercase">
                Estimated cost
              </p>
              <p className="mt-1.5 truncate font-display text-[26px] leading-none text-ink-900">
                {formatCurrency(trip.estimatedCost, trip.currency)}
              </p>
            </div>

            {budget && (
              <div className="min-w-0 shrink-0 text-right">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-300 uppercase">
                  Budget
                </p>
                <p className="mt-1.5 truncate font-display text-[15px] leading-none text-ink-700">
                  {formatCurrency(trip.budgetLimit, trip.currency, { compact: true })}
                </p>
              </div>
            )}
          </div>

          {budget && (
            <>
              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-canvas-deep">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    budget.over ? 'bg-ember-500' : 'bg-brand-400'
                  )}
                  style={{ width: `${Math.max(budget.percent, 3)}%` }}
                />
              </div>
              <p
                className={cn(
                  'mt-1.5 text-[11px]',
                  budget.over ? 'font-semibold text-ember-700' : 'text-ink-500'
                )}
              >
                {budget.over ? 'Over budget' : `${budget.percent}% of budget used`}
              </p>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-4">
          {/* Stretched link: the card is one big target, but Delete sits above
              it in the stacking order so it stays independently clickable. */}
          <Link
            to={ROUTES.trip(trip._id)}
            className={cn(
              'flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors duration-300',
              "before:absolute before:inset-0 before:content-[''] hover:text-brand-700"
            )}
          >
            Open itinerary
            <ArrowRight
              className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(trip)}
              aria-label={`Delete ${trip.name}`}
              title={`Delete ${trip.name}`}
              className={cn(
                'relative z-10 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full',
                'text-ink-300 transition-colors duration-300 hover:bg-ember-50 hover:text-ember-700'
              )}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/**
 * Same silhouette as the real card — 16:11 cover, title block, route chips,
 * money block, action row — so the grid does not reflow when trips land.
 */
export const TripCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl border border-line bg-surface" aria-hidden>
    <div className="aspect-16/11 animate-pulse border-b border-line bg-canvas-deep" />

    <div className="p-5">
      <div className="h-5 w-3/4 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-2 h-3 w-2/5 animate-pulse rounded-full bg-canvas-deep" />

      <div className="mt-5 flex gap-1.5">
        <div className="h-6 w-16 animate-pulse rounded-full bg-canvas-deep" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-canvas-deep" />
        <div className="h-6 w-14 animate-pulse rounded-full bg-canvas-deep" />
      </div>

      <div className="mt-5 h-2 w-20 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-2 h-6 w-28 animate-pulse rounded-full bg-canvas-deep" />
      <div className="mt-3 h-[3px] w-full animate-pulse rounded-full bg-canvas-deep" />

      <div className="mt-5 h-4 w-1/2 animate-pulse rounded-full bg-canvas-deep" />
    </div>
  </div>
);
