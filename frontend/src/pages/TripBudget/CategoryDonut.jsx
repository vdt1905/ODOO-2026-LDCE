import { BUDGET_CATEGORIES } from '../../lib/constants.js';
import { formatCurrency } from '../../lib/format.js';

/**
 * Spend by category, drawn by hand.
 *
 * There is no chart library in this project and adding one for a single donut
 * would be the largest dependency on the page. A circle stroked with
 * `strokeDasharray` is the whole technique: each segment gets an arc as long as
 * its share of the circumference, offset by the arcs already drawn.
 */
const R = 60;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * R; // ≈ 377
const BOX = 160; // r + stroke/2 = 73, so 80 centres it with room to spare

export const CategoryDonut = ({ byCategory, total, currency }) => {
  // An empty trip has a zero in every category. Dividing by that total would
  // put NaN straight into strokeDasharray and blank the whole SVG.
  const safeTotal = total > 0 ? total : 0;

  let drawn = 0;
  const segments = BUDGET_CATEGORIES.map((category) => {
    const amount = Number(byCategory?.[category.value]) || 0;
    const share = safeTotal > 0 ? amount / safeTotal : 0;
    const length = share * CIRCUMFERENCE;
    const offset = drawn;
    drawn += length;

    return { ...category, amount, share, length, offset };
  });

  const drawable = segments.filter((segment) => segment.length > 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${BOX} ${BOX}`}
          className="size-40"
          role="img"
          aria-label={
            safeTotal > 0
              ? `Spend by category, ${formatCurrency(safeTotal, currency)} in total`
              : 'Spend by category — nothing costed yet'
          }
        >
          {/* -90° so the first segment starts at twelve o'clock. */}
          <g transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`} fill="none" strokeWidth={STROKE}>
            <circle cx={BOX / 2} cy={BOX / 2} r={R} stroke="var(--color-canvas-deep)" />

            {drawable.map((segment) => (
              <circle
                key={segment.value}
                cx={BOX / 2}
                cy={BOX / 2}
                r={R}
                stroke={segment.color}
                // Butt caps: rounded ones overlap the neighbouring segment and
                // make a 1% slice look like a 4% one.
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="eyebrow text-ink-500">Total</span>
          <span className="mt-0.5 font-display text-xl text-ink-900">
            {formatCurrency(safeTotal, currency)}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.value} className="flex items-center gap-3">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{segment.label}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
              {formatCurrency(segment.amount, currency)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-500">
              {Math.round(segment.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
