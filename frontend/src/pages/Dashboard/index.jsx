import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { useAuthStore } from '../../store/authStore.js';
import { useTrips, useTripStats } from '../../hooks/useTrips.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Alert, ConfirmDialog } from '../../components/ui/index.js';
import { BudgetHighlights } from '../../components/dashboard/BudgetHighlights.jsx';
import { DashboardHero } from '../../components/dashboard/DashboardHero.jsx';
import { DestinationBoard } from '../../components/dashboard/DestinationBoard.jsx';
import { PlanTripFab } from '../../components/dashboard/PlanTripFab.jsx';
import { TripBoard } from '../../components/dashboard/TripBoard.jsx';
import { TripToolbar } from '../../components/dashboard/TripToolbar.jsx';

/**
 * The signed-in half of `/` — mockup screen 3.
 *
 * Banner and destination search up top, the city rail, then the user's own
 * trips under the search / group / filter / sort controls, with the floating
 * "Plan a trip" button pinned bottom-right.
 */
const DashboardPage = () => {
  usePageTitle('Your trips');

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Set by Create Trip on redirect, so the trip you just made is easy to spot.
  const createdId = params.get('created');
  const createdName = params.get('name');
  // Set only when the cover photo failed to upload — see CreateTrip's onSubmit.
  const coverWarning = location.state?.coverWarning;

  const [destinationQuery, setDestinationQuery] = useState('');
  const [tripSearch, setTripSearch] = useState('');
  const [group, setGroup] = useState('status');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('start-asc');

  const debouncedDestination = useDebouncedValue(destinationQuery, 350);
  const debouncedTripSearch = useDebouncedValue(tripSearch, 300);

  const { trips, total, loading, error, removeTrip } = useTrips({
    search: debouncedTripSearch,
    filter,
    sort,
  });
  const { stats, loading: statsLoading, refresh: refreshStats } = useTripStats();

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const dismissCreated = useCallback(() => {
    // Drops ?created=&name= *and* the router state behind them, without adding
    // a history entry to go back through. setSearchParams alone would leave the
    // state in place, so the warning would come back on a reload.
    navigate(ROUTES.landing, { replace: true, state: null });
  }, [navigate]);

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
    // The trip is gone from the list already; the totals need to catch up.
    refreshStats();
    if (createdId === pendingDelete._id) dismissCreated();
  };

  const isFiltered = Boolean(debouncedTripSearch) || filter !== 'all';

  return (
    <>
      <DashboardHero
        user={user}
        stats={stats}
        query={destinationQuery}
        onQueryChange={setDestinationQuery}
      />

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-12 pb-24 sm:px-6">
        <BudgetHighlights stats={stats} loading={statsLoading} />

        {createdId && (
          <div className="relative">
            <Alert tone="success" title={`${createdName || 'Your trip'} is ready to plan`}>
              It is in your list below. Add stops and activities whenever you are ready.
              {coverWarning && (
                <span className="mt-1.5 block font-medium">
                  The cover photo did not upload — {coverWarning} You can add one later from the
                  trip.
                </span>
              )}
            </Alert>
            <button
              type="button"
              onClick={dismissCreated}
              aria-label="Dismiss"
              className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full text-moss-800/60 transition-colors hover:bg-moss-100 hover:text-moss-800"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <DestinationBoard query={debouncedDestination} />

        <section id="your-trips" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                Your trips
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                {loading
                  ? 'Loading your itineraries…'
                  : total === 0 && !isFiltered
                    ? 'Nothing planned yet — the first one takes about a minute.'
                    : `${total} ${total === 1 ? 'trip' : 'trips'}${isFiltered ? ' matching your filters' : ' in your account'}`}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            <TripToolbar
              search={tripSearch}
              onSearchChange={setTripSearch}
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
              highlightId={createdId}
              onDelete={(trip) => {
                setDeleteError(null);
                setPendingDelete(trip);
              }}
            />
          </div>
        </section>
      </div>

      <PlanTripFab />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        loading={deleting}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        description="Its stops and activities go with it. This cannot be undone."
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

export default DashboardPage;
