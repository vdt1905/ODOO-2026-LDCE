import { useState } from 'react';

import { adminApi } from '../../api/admin.api.js';
import { cn } from '../../lib/cn.js';
import { formatDate } from '../../lib/dates.js';
import { formatNumber } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Button, EmptyState } from '../../components/ui/index.js';
import { Panel } from './Panel.jsx';
import { Activity } from 'lucide-react';

/** The server clamps `days` to 7–90, so these are the only ranges worth offering. */
const RANGES = [7, 30, 90];

/** Four gridlines that land on whole numbers, whatever the peak happens to be. */
const axisMax = (peak) => Math.max(4, Math.ceil(peak / 4) * 4);

/*
 * The plot is a 100×100 viewBox stretched with preserveAspectRatio="none", so
 * it fills any column width without a horizontal scrollbar. Two consequences
 * are deliberate: nothing round is drawn inside it (a circle would smear), and
 * every stroke is non-scaling so the lines stay 2px at 375px and at 1400px.
 * The labels are HTML *outside* the svg for the same reason — text inside a
 * stretched viewBox is illegible on a phone.
 */
const TOP = 2;
const SPAN = 96;

const yOf = (value, max) => TOP + SPAN * (1 - value / max);
const xOf = (index, count) => (count > 1 ? (index / (count - 1)) * 100 : 50);

const lineFor = (series, field, max) =>
  series
    .map(
      (row, index) =>
        `${index ? 'L' : 'M'}${xOf(index, series.length).toFixed(2)} ${yOf(row[field], max).toFixed(2)}`
    )
    .join(' ');

const areaFor = (series, field, max) =>
  `${lineFor(series, field, max)} L100 ${yOf(0, max).toFixed(2)} L0 ${yOf(0, max).toFixed(2)} Z`;

const Legend = ({ swatch, label, total }) => (
  <span className="inline-flex items-center gap-2 text-xs text-ink-700">
    <span className={cn('size-2.5 rounded-full', swatch)} aria-hidden />
    {label}
    <span className="font-medium text-ink-900">{formatNumber(total)}</span>
  </span>
);

export const TrendsChart = () => {
  const [days, setDays] = useState(30);

  const { data, loading, error } = useAsync(() => adminApi.trends(days), [days]);

  const series = data?.series ?? [];
  const totals = series.reduce(
    (sum, row) => ({ users: sum.users + row.users, trips: sum.trips + row.trips }),
    { users: 0, trips: 0 }
  );
  const max = axisMax(Math.max(...series.flatMap((row) => [row.users, row.trips]), 0));
  const ticks = [0, 1, 2, 3, 4].map((step) => (max / 4) * step);

  const ranges = (
    <div className="flex gap-2" role="group" aria-label="Chart range">
      {RANGES.map((range) => (
        <Button
          key={range}
          size="sm"
          variant={range === days ? 'primary' : 'outline'}
          aria-pressed={range === days}
          onClick={() => setDays(range)}
        >
          {range}d
        </Button>
      ))}
    </div>
  );

  return (
    <Panel
      title="Signups and trips"
      description="One point per day, oldest on the left. Days with no activity are real zeroes, not gaps."
      action={ranges}
    >
      {error && (
        <Alert tone="error" title="Trends could not be loaded" className="mb-4">
          {error.message}
        </Alert>
      )}

      {loading ? (
        <div className="h-56 animate-pulse rounded-3xl bg-canvas-deep" />
      ) : series.length < 2 ? (
        <EmptyState
          compact
          icon={Activity}
          title="No trend data yet"
          description="The chart fills in as accounts and trips are created."
        />
      ) : totals.users + totals.trips === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title={`Nothing happened in the last ${days} days`}
          description="No signups and no new trips in this window. Try a longer range."
        />
      ) : (
        <>
          <div className="flex gap-3">
            <div className="relative h-56 w-9 shrink-0">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2 text-[10px] text-ink-300 tabular-nums"
                  style={{ top: `${yOf(tick, max)}%` }}
                >
                  {formatNumber(tick)}
                </span>
              ))}
            </div>

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-56 w-full overflow-visible"
              role="img"
              aria-label={`${formatNumber(totals.users)} signups and ${formatNumber(totals.trips)} trips over the last ${days} days`}
            >
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1="0"
                  x2="100"
                  y1={yOf(tick, max)}
                  y2={yOf(tick, max)}
                  className="stroke-line"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={areaFor(series, 'trips', max)} className="fill-ember-500/12" />
              <path d={areaFor(series, 'users', max)} className="fill-brand-500/12" />

              <path
                d={lineFor(series, 'trips', max)}
                fill="none"
                className="stroke-ember-500"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={lineFor(series, 'users', max)}
                fill="none"
                className="stroke-brand-500"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Invisible per-day targets so hovering a day gives the browser's
                  own tooltip — cheap, and it needs no popover state. */}
              {series.map((row, index) => (
                <rect
                  key={row.date}
                  x={Math.max(0, xOf(index, series.length) - 50 / series.length)}
                  y="0"
                  width={100 / series.length}
                  height="100"
                  fill="transparent"
                  aria-hidden
                >
                  <title>{`${formatDate(row.date)} — ${formatNumber(row.users)} signups, ${formatNumber(row.trips)} trips`}</title>
                </rect>
              ))}
            </svg>
          </div>

          <div className="mt-2 ml-12 flex justify-between text-[11px] text-ink-500">
            <span>{formatDate(series[0].date, { withYear: false })}</span>
            <span className="hidden sm:inline">
              {formatDate(series[Math.floor(series.length / 2)].date, { withYear: false })}
            </span>
            <span>{formatDate(series[series.length - 1].date, { withYear: false })}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
            <Legend swatch="bg-brand-500" label="Signups" total={totals.users} />
            <Legend swatch="bg-ember-500" label="Trips created" total={totals.trips} />
            <span className="text-[11px] text-ink-300">in the last {days} days</span>
          </div>
        </>
      )}
    </Panel>
  );
};
