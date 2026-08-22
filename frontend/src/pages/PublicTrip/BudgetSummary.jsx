import { BUDGET_CATEGORIES } from '../../lib/constants.js';
import { formatCurrency, pluralise } from '../../lib/format.js';

/**
 * The trimmed budget the public payload carries: { currency, total, avgPerDay,
 * tripDays, byCategory, byStop }.
 *
 * There is no budget limit, no per-day row and no over-budget flag here — the
 * server keeps those for the owner — so nothing on this card may imply one.
 */
export const BudgetSummary = ({ budget }) => {
  const { currency, total, avgPerDay, tripDays, byCategory, byStop = [] } = budget;

  const slices = BUDGET_CATEGORIES.map((category) => ({
    ...category,
    amount: byCategory?.[category.value] || 0,
    share: total > 0 ? ((byCategory?.[category.value] || 0) / total) * 100 : 0,
  })).filter((slice) => slice.amount > 0);

  return (
    <section
      aria-labelledby="budget-heading"
      className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="budget-heading" className="font-display text-xl text-ink-900">
        What it costs
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Estimated from the stops and activities on this plan — flights home and anything
        unrecorded are not in it.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Estimated total', value: formatCurrency(total, currency) },
          { label: 'Average per day', value: formatCurrency(avgPerDay, currency) },
          { label: 'Length', value: pluralise(tripDays, 'day') },
          { label: 'Cities', value: pluralise(byStop.length, 'city', 'cities') },
        ].map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-inset px-4 py-3.5">
            <dt className="text-xs text-ink-500">{tile.label}</dt>
            <dd className="mt-1 font-display text-lg text-ink-900">{tile.value}</dd>
          </div>
        ))}
      </dl>

      {slices.length > 0 ? (
        <div className="mt-6">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-canvas-deep" aria-hidden>
            {slices.map((slice) => (
              <span
                key={slice.value}
                style={{ width: `${slice.share}%`, backgroundColor: slice.color }}
              />
            ))}
          </div>

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {slices.map((slice) => (
              <div key={slice.value} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <dt className="text-ink-500">{slice.label}</dt>
                <dd className="font-medium text-ink-900">
                  {formatCurrency(slice.amount, currency)}
                  <span className="ml-1 font-normal text-ink-500">
                    {Math.round(slice.share)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-inset px-4 py-3 text-sm text-ink-500">
          No costs recorded on this itinerary yet.
        </p>
      )}

      {byStop.length > 0 && (
        <ul className="mt-6 divide-y divide-line-soft border-t border-line-soft">
          {byStop.map((stop) => (
            <li key={stop.stopId} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="min-w-0 truncate text-sm text-ink-700">
                {stop.city}
                <span className="ml-2 text-xs text-ink-500">
                  {pluralise(stop.nights, 'night')}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-ink-900">
                {formatCurrency(stop.total, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
