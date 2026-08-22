import { useMemo } from 'react';
import { Compass, Plus, SearchX } from 'lucide-react';

import { ROUTES, TRIP_STATUS_META, TRIP_STATUS_ORDER } from '../../lib/constants.js';
import { formatMonthYear, monthKey } from '../../lib/dates.js';
import { pluralise } from '../../lib/format.js';
import { Alert, Badge, Button, EmptyState } from '../ui/index.js';
import { TripCard, TripCardSkeleton } from '../trip/TripCard.jsx';

/**
 * Splits the list into the sections the mockup shows.
 *
 * Grouping is client-side because it changes nothing about *which* trips were
 * fetched — only how they are stacked. Sorting inside each group is left alone
 * so the server's `sort` param stays the single source of order.
 */
const groupTrips = (trips, group) => {
  if (group === 'none') return [{ key: 'all', title: null, trips }];

  if (group === 'month') {
    const buckets = new Map();
    for (const trip of trips) {
      const key = monthKey(trip.startDate);
      if (!buckets.has(key)) {
        buckets.set(key, { key, title: formatMonthYear(trip.startDate), trips: [] });
      }
      buckets.get(key).trips.push(trip);
    }
    // Chronological headings regardless of the sort applied inside them.
    return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  return TRIP_STATUS_ORDER.map((status) => ({
    key: status,
    title: TRIP_STATUS_META[status].label,
    blurb: TRIP_STATUS_META[status].blurb,
    tone: TRIP_STATUS_META[status].tone,
    trips: trips.filter((trip) => trip.status === status),
  })).filter((section) => section.trips.length > 0);
};

export const TripBoard = ({ trips, loading, error, group, isFiltered, onDelete, highlightId }) => {
  const sections = useMemo(() => groupTrips(trips, group), [trips, group]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert tone="error" title="Your trips could not be loaded">
        {error.message}
      </Alert>
    );
  }

  if (trips.length === 0) {
    return isFiltered ? (
      <EmptyState
        compact
        icon={SearchX}
        title="No trips match that"
        description="Try a different filter, or clear the search to see everything you have planned."
      />
    ) : (
      <EmptyState
        icon={Compass}
        title="No trips yet"
        description="Name a trip, set the dates, and start dropping in the cities you want to see."
        action={
          <Button to={ROUTES.newTrip} size="lg" leftIcon={<Plus className="size-4" />}>
            Plan your first trip
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.key}>
          {section.title && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-xl font-bold text-ink-900">{section.title}</h3>
              <Badge tone={section.tone || 'neutral'}>
                {pluralise(section.trips.length, 'trip')}
              </Badge>
              {section.blurb && <p className="text-sm text-ink-500">{section.blurb}</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onDelete={onDelete}
                highlighted={trip._id === highlightId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
