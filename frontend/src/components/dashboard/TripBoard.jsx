import { useMemo } from 'react';
import { Compass, Plus, RotateCcw, SearchX } from 'lucide-react';

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

/**
 * "No trips" is true but useless when the reason is that you asked for past
 * trips and have never taken one. Each filter gets copy that names its own
 * situation and points at the way out of it.
 */
const EMPTY_BY_FILTER = {
  ongoing: {
    title: 'No trips under way',
    description: 'Nothing is happening today. Switch to Upcoming to see what is next.',
  },
  upcoming: {
    title: 'Nothing upcoming',
    description: 'No departures on the calendar. Plan one and it shows up here straight away.',
  },
  completed: {
    title: 'No past trips yet',
    description: 'Once a trip’s dates have gone by it moves here as a record of where you went.',
  },
  public: {
    title: 'Nothing shared publicly',
    description:
      'Publish a trip from its itinerary page to get a link anyone can open and copy.',
  },
};

const GRID = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

export const TripBoard = ({
  trips,
  loading,
  error,
  group,
  isFiltered,
  onDelete,
  highlightId,
  /** Optional: what the toolbar is currently asking for, so an empty result
   *  can explain itself rather than shrugging. */
  filter = 'all',
  search = '',
  /** Optional: re-run the request behind an error banner. */
  onRetry,
  /** Optional: drop every filter from an empty result. */
  onClearFilters,
}) => {
  const sections = useMemo(() => groupTrips(trips, group), [trips, group]);

  if (loading) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading your trips">
        {Array.from({ length: 6 }, (_, i) => (
          <TripCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        tone="error"
        title="Your trips could not be loaded"
        action={
          onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RotateCcw className="size-4" />}
            >
              Try again
            </Button>
          )
        }
      >
        {error.message} Nothing has been lost — this is only the list failing to arrive.
      </Alert>
    );
  }

  if (trips.length === 0) {
    if (isFiltered) {
      const term = search.trim();
      const copy = EMPTY_BY_FILTER[filter];

      return (
        <EmptyState
          compact
          icon={SearchX}
          title={term ? `No trips match “${term}”` : (copy?.title ?? 'No trips match that')}
          description={
            term
              ? 'Try a shorter spelling, or a city name instead of the trip name.'
              : (copy?.description ??
                'Try a different filter, or clear it to see everything you have planned.')
          }
          // Clearing the filter is the way back to a non-empty page, so it is
          // the primary move here; planning a new trip is the fallback.
          action={
            onClearFilters ? (
              <Button onClick={onClearFilters}>Show all trips</Button>
            ) : (
              <Button to={ROUTES.newTrip} leftIcon={<Plus className="size-4" />}>
                Plan a trip
              </Button>
            )
          }
          secondaryAction={
            onClearFilters && (
              <Button to={ROUTES.newTrip} variant="outline" leftIcon={<Plus className="size-4" />}>
                Plan a trip
              </Button>
            )
          }
        />
      );
    }

    return (
      <EmptyState
        icon={Compass}
        title="No trips yet"
        description="Name a trip, set the dates, and start dropping in the cities you want to see. It takes about a minute."
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
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line pb-3">
              <h3 className="font-display text-xl leading-none text-ink-900 uppercase">
                {section.title}
              </h3>
              <Badge tone={section.tone || 'neutral'} size="sm">
                {pluralise(section.trips.length, 'trip')}
              </Badge>
              {section.blurb && <p className="text-sm text-ink-500">{section.blurb}</p>}
            </div>
          )}

          <div className={GRID}>
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
