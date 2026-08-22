import { MapPinned } from 'lucide-react';

import { adminApi } from '../../api/admin.api.js';
import { formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Badge, EmptyState } from '../../components/ui/index.js';
import { Panel, RowSkeleton } from './Panel.jsx';

export const PopularCities = ({ limit = 8 }) => {
  const { data: items, loading, error } = useAsync(() => adminApi.popularCities(limit), [limit], {
    initial: [],
  });

  // The bar is relative to the leader, not to the total — with a long tail the
  // percentage-of-total version renders every row as an invisible sliver.
  const peak = Math.max(...(items ?? []).map((city) => city.tripCount), 1);

  return (
    <Panel
      title="Most-planned cities"
      description="Ranked by how many separate trips include a stop there."
    >
      {error && (
        <Alert tone="error" title="Popular cities could not be loaded" className="mb-4">
          {error.message}
        </Alert>
      )}

      {loading ? (
        <RowSkeleton rows={6} />
      ) : items?.length ? (
        <ol className="space-y-2">
          {/* cityId, not _id — the aggregation projects the grouped city id
              under its own name and drops _id entirely. */}
          {items.map((city, index) => (
            <li
              key={city.cityId}
              className="flex items-center gap-3 rounded-2xl border border-line bg-inset px-3 py-2.5"
            >
              <span className="w-5 shrink-0 text-center font-display text-sm text-ink-300 tabular-nums">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="truncate text-sm font-medium text-ink-900">{city.name}</p>
                  <p className="truncate text-xs text-ink-500">{city.country}</p>
                </div>

                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(4, (city.tripCount / peak) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-ink-900 tabular-nums">
                  {formatNumber(city.tripCount)}
                </p>
                <p className="text-[11px] text-ink-500">{pluralise(city.stops, 'stop')}</p>
              </div>

              <Badge tone="outline" className="hidden shrink-0 sm:inline-flex">
                {city.region}
              </Badge>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          compact
          icon={MapPinned}
          title="No cities on any itinerary yet"
          description="This fills in as soon as someone adds their first stop."
        />
      )}
    </Panel>
  );
};
