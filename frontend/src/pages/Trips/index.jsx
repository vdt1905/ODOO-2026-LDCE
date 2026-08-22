import { useState } from 'react';
import { Plus } from 'lucide-react';

import { BANNERS, ROUTES } from '../../lib/constants.js';
import { listNames, pluralise } from '../../lib/format.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useTrips } from '../../hooks/useTrips.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Alert, Button, ConfirmDialog } from '../../components/ui/index.js';
import { TripBoard } from '../../components/dashboard/TripBoard.jsx';
import { TripToolbar } from '../../components/dashboard/TripToolbar.jsx';

/** The ceiling listTripsSchema allows. The library is one page, not a feed. */
const LIMIT = 50;

/**
 * What disappears alongside the trip, taken from the list row rather than the
 * delete response — that one only arrives once it is too late to warn anybody.
 */
const deleteBlurb = (trip) => {
  if (!trip) return '';

  const parts = [];
  if (trip.stopCount) parts.push(pluralise(trip.stopCount, 'stop'));
  if (trip.activityCount) parts.push(pluralise(trip.activityCount, 'activity', 'activities'));

  return parts.length
    ? `This also removes ${listNames(parts)}. It cannot be undone.`
    : 'Nothing else is attached to it yet. This cannot be undone.';
};

/**
 * My trips — the complete library behind the dashboard's preview.
 *
 * Search, filter and sort are the server's; grouping is TripBoard's and stays
 * on the client, so changing the headings never costs a request.
 */
const TripsPage = () => {
  usePageTitle('My trips');

  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('status');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('start-asc');

  const debouncedSearch = useDebouncedValue(search, 350);

  const { trips, total, loading, error, removeTrip } = useTrips({
    search: debouncedSearch,
    filter,
    sort,
    limit: LIMIT,
  });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const isFiltered = Boolean(debouncedSearch) || filter !== 'all';

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setDeleting(true);
    const result = await removeTrip(pendingDelete._id);
    setDeleting(false);

    if (!result.ok) {
      setDeleteError(result.error.message);
      return;
    }

    setDeleteError(null);
    setPendingDelete(null);
  };

  /** Never claim a number the grid below is not actually showing. */
  const countLine = () => {
    if (loading) return 'Counting your trips…';
    if (total === 0) {
      return isFiltered
        ? 'Nothing matches those filters'
        : 'Nothing planned yet — the first one takes about a minute';
    }

    const counted = `${pluralise(total, 'trip')}${isFiltered ? ' matching your filters' : ' in your account'}`;
    return trips.length < total ? `${counted} · showing the first ${trips.length}` : counted;
  };

  return (
    <>
      <PageHeader
        image={BANNERS.trips}
        kicker="Your library"
        title="My trips"
        sub="Every itinerary you have started, from the one leaving on Friday to the one you took two summers ago."
        actions={
          <Button to={ROUTES.newTrip} variant="light" leftIcon={<Plus className="size-4" />}>
            Plan a trip
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-ink-900">Everything you have planned</h2>
            <p className="mt-1 text-sm text-ink-500">{countLine()}</p>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          <TripToolbar
            search={search}
            onSearchChange={setSearch}
            group={group}
            onGroupChange={setGroup}
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
          />

          {deleteError && (
            <Alert tone="error" title="That trip could not be deleted">
              {deleteError}
            </Alert>
          )}

          <TripBoard
            trips={trips}
            loading={loading}
            error={error}
            group={group}
            isFiltered={isFiltered}
            onDelete={(trip) => {
              setDeleteError(null);
              setPendingDelete(trip);
            }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        loading={deleting}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        description={deleteBlurb(pendingDelete)}
        confirmLabel="Delete trip"
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </>
  );
};

export default TripsPage;
