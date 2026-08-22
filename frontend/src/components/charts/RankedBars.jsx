/**
 * Horizontal ranked bars — a label, an optional sublabel, a proportional bar
 * sized against the largest row, and a value on the right.
 *
 * Used for any "top N" comparison: popular cities, popular activities,
 * activity-type mix. Deliberately not a bar chart with its own axis — a
 * ranked list reads faster than a chart when the point is "what's #1".
 */
export const RankedBars = ({ rows, formatValue, emptyLabel = 'Nothing to show yet' }) => {
  if (!rows.length) {
    return <p className="rounded-2xl bg-canvas p-4 text-sm text-ink-500">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ol className="space-y-3">
      {rows.map((row, index) => (
        <li key={row.key ?? row.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right text-xs font-medium text-ink-300">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink-900">{row.label}</span>
              <strong className="shrink-0 text-sm text-ink-900">
                {formatValue ? formatValue(row.value) : row.value}
              </strong>
            </div>
            {row.sublabel && <p className="mt-0.5 truncate text-xs text-ink-500">{row.sublabel}</p>}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(4, (row.value / max) * 100)}%`,
                  backgroundColor: row.color || 'var(--color-clay-500)',
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
