import { Check, Circle, MapPin } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { formatCurrency, pluralise } from '../../lib/format.js';
import { formatDateRange } from '../../lib/dates.js';

/**
 * One figure and the word for it. The number is Anton and is the biggest thing
 * in the tile on purpose — this card exists to be scanned, not read.
 */
const Stat = ({ value, label, muted = false }) => (
  <div className="rounded-2xl border border-line bg-inset px-4 py-3.5">
    <p
      className={cn(
        'font-display text-[28px] leading-none',
        muted ? 'text-ink-300' : 'text-ink-900'
      )}
    >
      {value}
    </p>
    <p className="mt-2 text-[10px] font-semibold tracking-[0.11em] text-ink-500 uppercase">
      {label}
    </p>
  </div>
);

/** A checklist line: done, still to do, or done-but-optional. */
const Todo = ({ done, optional = false, children }) => (
  <li className="flex items-start gap-2.5 text-xs leading-relaxed">
    <span
      className={cn(
        'mt-px grid size-4 shrink-0 place-items-center rounded-full',
        done ? 'bg-brand-500 text-white' : 'text-ink-300'
      )}
      aria-hidden
    >
      {done ? <Check className="size-2.5" /> : <Circle className="size-3" />}
    </span>
    <span className={done ? 'text-ink-700' : 'text-ink-500'}>
      {children}
      {optional && !done && <span className="text-ink-300"> · optional</span>}
    </span>
  </li>
);

/**
 * The running total of everything the form has been told so far.
 *
 * It is deliberately derived from the live form values rather than from a saved
 * draft: the point is that a date change is visible as a different number of
 * nights before anyone commits to it, which is the whole reason the review step
 * sits beside the fields instead of after them.
 */
export const TripSummary = ({
  name,
  startDate,
  endDate,
  days,
  nights,
  budgetLimit,
  currency,
  cities,
  validRange,
}) => {
  const budget = budgetLimit === '' || budgetLimit == null ? null : Number(budgetLimit);
  const hasBudget = budget != null && Number.isFinite(budget) && budget > 0;
  const perDay = hasBudget && validRange && days > 0 ? budget / days : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-canvas-deep px-4 py-3.5">
        <p className="font-display text-base leading-tight text-ink-900 uppercase">
          {name?.trim() || 'Untitled trip'}
        </p>
        <p className="mt-1.5 text-xs text-ink-500">
          {validRange ? formatDateRange(startDate, endDate) : 'Dates not set yet'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat value={validRange ? days : '—'} label="Days" muted={!validRange} />
        <Stat value={validRange ? nights : '—'} label="Nights" muted={!validRange} />
        <Stat
          value={cities.length}
          label={cities.length === 1 ? 'City' : 'Cities'}
          muted={cities.length === 0}
        />
        <Stat
          value={perDay != null ? formatCurrency(perDay, currency, { compact: true }) : '—'}
          label="Per day"
          muted={perDay == null}
        />
      </div>

      {hasBudget && (
        <p className="text-xs leading-relaxed text-ink-500">
          {formatCurrency(budget, currency)} total
          {perDay != null
            ? ` — about ${formatCurrency(perDay, currency)} a day across ${pluralise(days, 'day')}.`
            : ' — add your dates to see a daily figure.'}
        </p>
      )}

      {cities.length > 0 && (
        <div>
          <p className="eyebrow text-ink-500">In this order</p>
          <ol className="mt-2.5 space-y-1.5">
            {cities.map((city, index) => (
              <li
                key={city._id}
                className="flex items-center gap-2.5 rounded-xl border border-line-soft bg-surface px-3 py-2 text-xs"
              >
                <span className="font-display text-sm leading-none text-brand-500">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{city.name}</span>
                <span className="flex min-w-0 shrink items-center gap-1 text-ink-500">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{city.country}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <p className="eyebrow text-ink-500">Checklist</p>
        <ul className="mt-2.5 space-y-2">
          <Todo done={Boolean(name?.trim())}>Name the trip</Todo>
          <Todo done={validRange}>Pick the start and end dates</Todo>
          <Todo done={cities.length > 0} optional>
            Choose the cities you already know about
          </Todo>
          <Todo done={hasBudget} optional>
            Set a budget so we can flag expensive days
          </Todo>
        </ul>
      </div>
    </div>
  );
};
