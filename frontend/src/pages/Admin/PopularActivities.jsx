import { Ticket } from 'lucide-react';

import { adminApi } from '../../api/admin.api.js';
import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, EmptyState } from '../../components/ui/index.js';
import { Panel, RowSkeleton } from './Panel.jsx';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

const labelFor = (type) => ACTIVITY_TYPE_META[type]?.label ?? type;


export const PopularActivities = ({ limit = 8 }) => {
  const { data, loading, error } = useAsync(() => adminApi.popularActivities(limit), [limit]);

  const items = data?.items ?? [];
  // byType ignores `limit` — it covers every type present, which is what makes
  // it usable as a full mix rather than a slice of the top few rows.
  const byType = data?.byType ?? [];
  const typeTotal = byType.reduce((sum, row) => sum + row.count, 0);

  return (
    <Panel
      title="Most-added activities"
      description="Catalog entries only — activities typed straight into an itinerary are not counted."
    >
      {error && (
        <Alert tone="error" title="Popular activities could not be loaded" className="mb-4">
          {error.message}
        </Alert>
      )}

      {loading ? (
        <RowSkeleton rows={6} />
      ) : items.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <ol className="space-y-2">
            {items.map((activity, index) => (
              <li
                key={activity.activityId}
                className="flex items-center gap-3 rounded-2xl border border-line bg-inset px-3 py-2.5"
              >
                <span className="w-5 shrink-0 text-center font-display text-sm text-ink-300 tabular-nums">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{activity.name}</p>
                  <p className="truncate text-xs text-ink-500">
                    {/* city/country come through as plain strings, already joined. */}
                    {[activity.city, activity.country].filter(Boolean).join(', ') ||
                      labelFor(activity.type)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-ink-900 tabular-nums">
                    {formatNumber(activity.count)}
                  </p>
                  <p className="text-[11px] text-ink-500">
                    avg {formatCurrency(activity.avgCost, 'USD')}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <h3 className="eyebrow text-ink-500">Type mix</h3>
            <ul className="mt-3 space-y-3">
              {byType.map((row) => (
                <li key={row.type}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 truncate text-ink-700">
                      <ActivityIcon type={row.type} className="size-3.5 text-ink-500" />
                      {labelFor(row.type)}
                    </span>
                    <span className="shrink-0 text-ink-500 tabular-nums">
                      {formatNumber(row.count)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                    <div
                      className="h-full rounded-full bg-brand-400"
                      style={{ width: `${Math.max(3, (row.count / typeTotal) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink-500">
              {pluralise(typeTotal, 'planned activity', 'planned activities')} across{' '}
              {pluralise(byType.length, 'type')}.
            </p>
          </div>
        </div>
      ) : (
        <EmptyState
          compact
          icon={Ticket}
          title="Nothing planned from the catalog yet"
          description="Counts appear once someone adds a catalog activity to a day."
        />
      )}
    </Panel>
  );
};
