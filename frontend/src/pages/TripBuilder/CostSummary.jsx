import { Loader2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { BUDGET_CATEGORIES } from '../../lib/constants.js';
import { formatCurrency, pluralise } from '../../lib/format.js';

/**
 * The running total, pinned under the navbar while you scroll the stop list.
 *
 * Every figure here comes from `costs.js`, which adds up the stops already in
 * local state — so the number moves on the keystroke, not on the response.
 */
export const CostSummary = ({ trip, totals, stopCount, saving }) => {
  const limit = Number(trip.budgetLimit) || 0;
  const ratio = limit > 0 ? totals.total / limit : null;
  const over = ratio !== null && ratio > 1;

  return (
    <div className="sticky top-24 z-30">
      <div className="rounded-3xl border border-line bg-surface/95 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="eyebrow flex items-center gap-2 text-ink-500">
              Running total
              {saving && (
                <span className="flex items-center gap-1 font-medium tracking-normal normal-case text-ink-300">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Saving
                </span>
              )}
            </p>
            <p className="mt-1.5 font-display text-3xl leading-none text-ink-900 sm:text-4xl">
              {formatCurrency(totals.total, trip.currency)}
            </p>
            <p className="mt-2 text-xs text-ink-500">
              {pluralise(stopCount, 'city', 'cities')} · {pluralise(totals.nights, 'night')} ·{' '}
              {pluralise(totals.activityCount, 'activity', 'activities')}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            {BUDGET_CATEGORIES.map((category) => (
              <div key={category.value} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden
                  />
                  <span className="truncate">{category.label}</span>
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-ink-900">
                  {formatCurrency(totals[category.value], trip.currency, { compact: true })}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {limit > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className={over ? 'font-medium text-ember-700' : 'text-ink-500'}>
                {over
                  ? `Over budget by ${formatCurrency(totals.total - limit, trip.currency)}`
                  : `${formatCurrency(limit - totals.total, trip.currency)} left of ${formatCurrency(limit, trip.currency)}`}
              </span>
              <span className="text-ink-500">{Math.round(ratio * 100)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-300',
                  over ? 'bg-ember-500' : 'bg-brand-500'
                )}
                // A hair of width even at zero, so the bar reads as a bar.
                style={{ width: `${Math.max(2, Math.min(100, ratio * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
