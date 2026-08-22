/**
 * Multi-series SVG line chart over a shared set of x-axis labels.
 * Same hand-rolled SVG approach as the budget page's daily-spend graph,
 * generalised to plot more than one series (e.g. signups vs trips created).
 */
export const TrendLines = ({ labels, series, formatValue = (v) => v }) => {
  const width = 760;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 28, left: 18 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const stepX = labels.length > 1 ? graphWidth / (labels.length - 1) : 0;
  const xFor = (index) => padding.left + (labels.length === 1 ? graphWidth / 2 : index * stepX);
  const yFor = (value) => padding.top + graphHeight - (value / max) * graphHeight;

  if (!labels.length) {
    return <p className="mt-6 rounded-2xl bg-canvas p-4 text-sm text-ink-500">No activity in this window yet.</p>;
  }

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Trend over time">
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + graphHeight}
          y2={padding.top + graphHeight}
          stroke="var(--color-line)"
          strokeWidth="1"
        />

        {series.map((s) => {
          const points = s.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
          return (
            <g key={s.key}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
              />
              {s.values.map((value, index) => (
                <circle
                  key={index}
                  cx={xFor(index)}
                  cy={yFor(value)}
                  r="3.5"
                  fill={s.color}
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                >
                  <title>{`${labels[index]} — ${s.label}: ${formatValue(value)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{labels[0]}</span>
        <span className="flex gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <i className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </span>
        <span>{labels.at(-1)}</span>
      </div>
    </div>
  );
};
