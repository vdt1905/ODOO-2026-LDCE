import { cn } from '../../lib/cn.js';

/**
 * Conic-gradient donut with a centered total.
 * Conic-gradient needs literal color values, not Tailwind classes, so `rows`
 * carry a `color` hex pulled from the design tokens in index.css — never an
 * invented color.
 */
export const Donut = ({ rows, total, centerLabel = 'Total', formatValue, size = 'size-44' }) => {
  const safeTotal = Math.max(1, total || 0);

  let cursor = 0;
  const slices = rows.map((row) => {
    const next = cursor + (row.value / safeTotal) * 100;
    const slice = `${row.color} ${cursor}% ${next}%`;
    cursor = next;
    return slice;
  });

  const style = total
    ? { background: `conic-gradient(${slices.join(', ')})` }
    : { background: 'var(--color-canvas-deep)' };

  return (
    <div className={cn('relative grid shrink-0 place-items-center rounded-full', size)} style={style}>
      <div className="grid size-[62%] place-items-center rounded-full bg-surface text-center shadow-soft">
        <span className="text-xs text-ink-500">{centerLabel}</span>
        <strong className="mt-1 px-3 font-display text-xl leading-tight">
          {formatValue ? formatValue(total) : total}
        </strong>
      </div>
    </div>
  );
};

/** Legend row paired with a Donut — a colour swatch, label, value and share bar. */
export const DonutLegend = ({ rows, total, formatValue }) => (
  <div className="w-full space-y-4">
    {rows.map((row) => {
      const percent = total ? Math.round((row.value / total) * 100) : 0;
      return (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-600">
              <i className="size-3 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <strong>
              {formatValue ? formatValue(row.value) : row.value}{' '}
              <span className="font-normal text-ink-500">{percent}%</span>
            </strong>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas-deep">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percent}%`, backgroundColor: row.color }}
            />
          </div>
        </div>
      );
    })}
  </div>
);
