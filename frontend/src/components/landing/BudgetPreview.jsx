import { TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * A static preview of the budget screen so the landing page shows the product,
 * not just claims about it. Numbers are illustrative until a real trip exists.
 */
const CATEGORIES = [
  { label: 'Stay', amount: 1180, color: 'var(--color-cat-stay)' },
  { label: 'Activities', amount: 860, color: 'var(--color-cat-activities)' },
  { label: 'Transport', amount: 720, color: 'var(--color-cat-transport)' },
  { label: 'Meals', amount: 480, color: 'var(--color-cat-meals)' },
];

const TOTAL = CATEGORIES.reduce((sum, c) => sum + c.amount, 0);

const donutBackground = () => {
  let cursor = 0;
  const stops = CATEGORIES.map((c) => {
    const start = (cursor / TOTAL) * 360;
    cursor += c.amount;
    const end = (cursor / TOTAL) * 360;
    return `${c.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
};

export const BudgetPreview = () => (
  <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div>
        <Badge tone="clay">Budget, live</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Know what the trip costs before you book it
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">
          Stays, transfers, meals and every activity roll into one breakdown that updates
          the moment you change the plan. Set a ceiling and GlobeTrotter flags the days
          that blow past it.
        </p>

        <dl className="mt-8 grid max-w-md grid-cols-2 gap-4">
          {[
            { label: 'Trip total', value: `$${TOTAL.toLocaleString()}` },
            { label: 'Average per day', value: `$${Math.round(TOTAL / 12)}` },
            { label: 'Cities', value: '3' },
            { label: 'Days planned', value: '12' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-surface p-4">
              <dt className="text-xs text-ink-500">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-ink-900">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-4xl border border-line bg-surface p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-500">Europe Summer 2026</p>
            <p className="font-display text-xl font-bold text-ink-900">Cost breakdown</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-moss-50 px-2.5 py-1 text-xs font-medium text-moss-800">
            <TrendingUp className="size-3" aria-hidden />
            Under budget
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row">
          <div
            className="relative size-40 shrink-0 rounded-full"
            style={{ background: donutBackground() }}
            role="img"
            aria-label="Cost split by category"
          >
            <div className="absolute inset-[22%] grid place-items-center rounded-full bg-surface text-center">
              <div>
                <p className="text-[10px] text-ink-500">Total</p>
                <p className="font-display text-lg font-bold text-ink-900">
                  ${(TOTAL / 1000).toFixed(2)}k
                </p>
              </div>
            </div>
          </div>

          <ul className="w-full space-y-3">
            {CATEGORIES.map((category) => (
              <li key={category.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-700">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label}
                  </span>
                  <span className="font-medium text-ink-900">
                    ${category.amount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(category.amount / TOTAL) * 100}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);
