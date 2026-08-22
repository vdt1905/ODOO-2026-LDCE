import { Clock, MapPin, Sunrise } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { formatDate } from '../../lib/dates.js';
import { formatCurrency } from '../../lib/format.js';
import { Badge } from '../../components/ui/index.js';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

/** "2h 30m" / "45m". Falsy durations return '' and the row simply omits them. */
const formatDuration = (minutes) => {
  const total = Number(minutes) || 0;
  if (total <= 0) return '';

  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const ActivityRow = ({ activity, currency }) => {
  // `type` is 'custom' for free-text entries with no catalog row behind them.
  const meta = ACTIVITY_TYPE_META[activity.type] || ACTIVITY_TYPE_META.custom;
  const duration = formatDuration(activity.durationMinutes);

  return (
    <li className="group grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-3">
      <p className="pt-4 text-right text-xs font-semibold tabular-nums text-ink-700">
        {activity.startTime || <span className="font-medium text-ink-300">Any time</span>}
      </p>

      {/* The rail is the left border of this column; the last row drops it so
          the timeline ends on the final dot instead of trailing into nothing. */}
      <div className="relative border-l border-line pb-3 pl-4 group-last:border-transparent group-last:pb-0 sm:pl-5">
        <span
          className="absolute top-4 -left-[4.5px] size-2 rounded-full bg-brand-400"
          aria-hidden
        />

        <div className="rounded-2xl border border-line bg-inset p-3.5 sm:p-4">
          <div className="flex gap-3">
            {activity.imageUrl && (
              <img
                src={activity.imageUrl}
                alt=""
                loading="lazy"
                className="size-16 shrink-0 rounded-xl border border-line object-cover"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <h4 className="min-w-0 font-display text-base text-ink-900">{activity.name}</h4>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                  {formatCurrency(activity.cost, currency)}
                </span>
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <span className="flex items-center gap-1.5">
                  <ActivityIcon type={activity.type} className="size-3.5" />
                  {meta.label}
                </span>
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {duration}
                  </span>
                )}
              </p>

              {activity.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-700">
                  {activity.description}
                </p>
              )}
            </div>
          </div>

          {activity.notes && (
            <p className="mt-3 rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-700">
              {activity.notes}
            </p>
          )}
        </div>
      </div>
    </li>
  );
};

/**
 * One calendar day of the itinerary.
 *
 * Every day between the trip's start and end has a row, empty ones included —
 * that is what makes an unplanned gap visible instead of quietly collapsing.
 * `showCity` is off in the by-city view, where the heading above already says
 * which city these days belong to.
 */
export const DayCard = ({ day, currency, showCity = true }) => {
  const place = day.stop ? [day.stop.city, day.stop.country].filter(Boolean).join(', ') : null;

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="eyebrow text-ink-500">Day {day.dayNumber}</p>
          <h3 className="mt-1 font-display text-lg text-ink-900">{formatDate(day.date)}</h3>

          {showCity && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
              {day.stop ? (
                <>
                  <MapPin className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                  {place}
                </>
              ) : (
                <>
                  <Sunrise className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                  Free day — no city booked
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {day.isArrivalDay && <Badge tone="brand">Arrive</Badge>}
          {day.isDepartureDay && <Badge tone="outline">Depart</Badge>}
          <span className="rounded-full bg-canvas-deep px-3 py-1 text-xs font-semibold tabular-nums text-ink-900">
            {formatCurrency(day.subtotal, currency)}
          </span>
        </div>
      </header>

      <div className="px-4 py-4 sm:px-5">
        {day.activities.length > 0 ? (
          // Server order is the intended order — sorted by start time, then by
          // the manual `order` the builder writes. Never re-sort here.
          <ol>
            {day.activities.map((activity) => (
              <ActivityRow key={activity._id} activity={activity} currency={currency} />
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-inset px-4 py-5 text-center text-sm text-ink-500">
            Nothing planned yet.
          </p>
        )}
      </div>
    </article>
  );
};

export const DayCardSkeleton = ({ className }) => (
  <div className={cn('rounded-3xl border border-line bg-surface', className)}>
    <div className="space-y-2 border-b border-line px-5 py-4">
      <div className="h-2.5 w-16 animate-pulse rounded-full bg-canvas-deep" />
      <div className="h-4 w-40 animate-pulse rounded-full bg-canvas-deep" />
    </div>
    <div className="space-y-3 px-5 py-5">
      <div className="h-16 animate-pulse rounded-2xl bg-canvas-deep" />
      <div className="h-16 animate-pulse rounded-2xl bg-canvas-deep" />
    </div>
  </div>
);
