import { BUDGET_CATEGORIES } from '../../lib/constants.js';
import { formatDate, toUtcDate } from '../../lib/dates.js';
import { formatCurrency, pluralise } from '../../lib/format.js';

/**
 * Spend per calendar day, stacked by category.
 *
 * CSS boxes rather than SVG: the bars only ever need a percentage height, and a
 * flex row of divs reflows on a phone for free where an SVG viewBox would have
 * to be recomputed.
 *
 * `dailySpend` is never sparse — the API emits a row for every day of the trip,
 * zeros included — so the axis needs no gap filling.
 */
export const DailySpendChart = ({ dailySpend = [], dailyAllowance, currency }) => {
  const peak = dailySpend.reduce((max, day) => Math.max(max, day.total), 0);
  // An untouched trip is all zeros; without this every height divides by zero.
  const scale = peak > 0 ? peak : 1;

  // A label under every column stops being readable somewhere past a fortnight.
  const step = dailySpend.length > 24 ? 5 : dailySpend.length > 14 ? 2 : 1;

  const hasAllowance = dailyAllowance !== null && dailyAllowance !== undefined;
  const allowanceOffset =
    hasAllowance && peak > 0 ? Math.min(100, (dailyAllowance / scale) * 100) : null;

  const overCount = dailySpend.filter((day) => day.isOverBudget).length;

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-xl"
        role="img"
        aria-label={
          peak > 0
            ? `Daily spend across ${pluralise(dailySpend.length, 'day')}, peaking at ${formatCurrency(peak, currency)}${
                overCount > 0 ? `, with ${pluralise(overCount, 'day')} over the daily allowance` : ''
              }`
            : 'Daily spend — nothing costed yet'
        }
      >
        <div className="relative flex h-52 items-end gap-1.5">
          {allowanceOffset !== null && (
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink-300"
              style={{ bottom: `${allowanceOffset}%` }}
              aria-hidden
            >
              <span className="absolute -top-5 right-0 rounded-full bg-canvas-deep px-2 py-0.5 text-[10px] font-medium text-ink-700">
                Allowance {formatCurrency(dailyAllowance, currency)}/day
              </span>
            </div>
          )}

          {dailySpend.map((day) => (
            <div
              key={day.date}
              className="flex h-full min-w-2 flex-1 flex-col justify-end"
              title={`${formatDate(day.date)} · ${formatCurrency(day.total, currency)}${
                day.isOverBudget ? ' · over the daily allowance' : ''
              }`}
            >
              {day.total > 0 ? (
                <div
                  className="flex flex-col-reverse overflow-hidden rounded-t-md"
                  style={{ height: `${Math.max((day.total / scale) * 100, 1.5)}%` }}
                >
                  {BUDGET_CATEGORIES.map((category) => {
                    const amount = Number(day[category.value]) || 0;
                    if (amount <= 0) return null;

                    return (
                      <div
                        key={category.value}
                        style={{
                          // Relative to the day's own total, so the stack always
                          // fills exactly the bar it sits in.
                          height: `${(amount / day.total) * 100}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-0.5 rounded-full bg-canvas-deep" />
              )}
            </div>
          ))}
        </div>

        {/* Over-budget markers and the date axis, one cell per bar. */}
        <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
          {dailySpend.map((day, index) => (
            <div key={day.date} className="min-w-2 flex-1 text-center">
              <span
                className={`mx-auto block size-1.5 rounded-full ${
                  day.isOverBudget ? 'bg-ember-500' : 'bg-transparent'
                }`}
                aria-hidden
              />
              <span className="mt-1 block text-[10px] tabular-nums text-ink-500">
                {index % step === 0 ? toUtcDate(day.date)?.getUTCDate() : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
