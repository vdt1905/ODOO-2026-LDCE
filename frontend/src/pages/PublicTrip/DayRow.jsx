import { CalendarOff, Clock, Hourglass, PlaneLanding, PlaneTakeoff } from 'lucide-react';

import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { formatDate } from '../../lib/dates.js';
import { formatCurrency } from '../../lib/format.js';
import { Badge } from '../../components/ui/index.js';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

/** 150 → "2h 30m". Local to this screen; nothing else formats a duration yet. */
const formatDuration = (minutes) => {
  const total = Number(minutes) || 0;
  if (total <= 0) return '';

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return [hours && `${hours}h`, mins && `${mins}m`].filter(Boolean).join(' ');
};

const ActivityRow = ({ activity, currency }) => {
  // `custom` covers free-text entries with no catalog row behind them, and an
  // unknown type from an older document falls back to the same label.
  const meta = ACTIVITY_TYPE_META[activity.type] || ACTIVITY_TYPE_META.custom;
  const duration = formatDuration(activity.durationMinutes);

  return (
    <li className="flex gap-3 rounded-2xl bg-inset p-3">
      {activity.imageUrl ? (
        <img
          src={activity.imageUrl}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-canvas-deep text-ink-500">
          <ActivityIcon type={activity.type} className="size-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="font-medium text-ink-900">{activity.name}</p>
          <p className="text-sm font-medium text-ink-900">
            {formatCurrency(activity.cost, currency)}
          </p>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {/* startTime is optional on the server and ships as '' — an empty
                slot would read as a missing value rather than a loose plan. */}
            {activity.startTime || 'Any time'}
          </span>
          {duration && (
            <span className="flex items-center gap-1">
              <Hourglass className="size-3.5" aria-hidden />
              {duration}
            </span>
          )}
          <span>{meta.label}</span>
        </p>

        {activity.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-700">
            {activity.description}
          </p>
        )}

        {activity.notes && (
          <p className="mt-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-700">
            {activity.notes}
          </p>
        )}
      </div>
    </li>
  );
};

/**
 * One calendar day of the shared itinerary.
 *
 * Days with no stop are kept rather than collapsed — a gap in a plan is
 * information, and hiding it makes an eight-day trip look like a five-day one.
 */
export const DayRow = ({ day, currency }) => {
  const hasActivities = day.activities.length > 0;

  if (!day.stop && !hasActivities) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-dashed border-line-dashed bg-surface/60 px-5 py-3.5">
        <span className="eyebrow text-ink-300">Day {day.dayNumber}</span>
        <span className="text-sm text-ink-500">{formatDate(day.date)}</span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
          <CalendarOff className="size-3.5 text-ink-300" aria-hidden />
          Free day
        </span>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4">
        <div className="min-w-0">
          <p className="eyebrow text-ink-300">Day {day.dayNumber}</p>
          <h3 className="mt-1 font-display text-xl text-ink-900">
            {/* `stop.city` and `stop.country` are plain strings on this payload,
                not populated city documents. */}
            {day.stop ? day.stop.city : 'Free day'}
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            {formatDate(day.date, { long: true })}
            {day.stop?.country && ` · ${day.stop.country}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {day.isArrivalDay && (
            <Badge tone="brand">
              <PlaneLanding className="size-3.5" aria-hidden />
              Arrive
            </Badge>
          )}
          {day.isDepartureDay && (
            <Badge tone="neutral">
              <PlaneTakeoff className="size-3.5" aria-hidden />
              Move on
            </Badge>
          )}
          {day.subtotal > 0 && (
            <span className="text-sm font-medium text-ink-900">
              <span className="sr-only">Activities on this day cost </span>
              {formatCurrency(day.subtotal, currency)}
            </span>
          )}
        </div>
      </header>

      {hasActivities ? (
        <ul className="space-y-2 p-3 sm:p-4">
          {day.activities.map((activity) => (
            <ActivityRow key={activity._id} activity={activity} currency={currency} />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-ink-500">
          Nothing booked — a day to wander {day.stop ? day.stop.city : 'wherever'}.
        </p>
      )}
    </article>
  );
};
