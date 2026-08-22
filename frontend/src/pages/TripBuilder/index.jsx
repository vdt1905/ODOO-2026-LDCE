import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Compass, Plus, Route, Wallet } from 'lucide-react';

import { toApiError } from '../../api/client.js';
import { stopApi } from '../../api/stop.api.js';
import { tripApi } from '../../api/trip.api.js';
import { tripActivityApi } from '../../api/tripActivity.api.js';
import { BANNERS, ROUTES } from '../../lib/constants.js';
import { toDateInputValue } from '../../lib/dates.js';
import { pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Alert, Button, ConfirmDialog, EmptyState } from '../../components/ui/index.js';
import { ActivityPicker } from './ActivityPicker.jsx';
import { AddStopPanel } from './AddStopPanel.jsx';
import { CostSummary } from './CostSummary.jsx';
import { StopCard, StopCardSkeleton } from './StopCard.jsx';
import { TripSettings } from './TripSettings.jsx';
import { tripCost } from './costs.js';

/** The server's own ordering, so a local insert lands where a refetch would put it. */
const byDateThenOrder = (a, b) =>
  toDateInputValue(a.date).localeCompare(toDateInputValue(b.date)) ||
  (a.order ?? 0) - (b.order ?? 0);

const sameId = (a, b) => String(a) === String(b);

/**
 * The itinerary builder — cities in, dates on, activities under.
 *
 * One `GET /trips/:id` loads everything: the trip carries its stops, and each
 * stop carries its own activities, regrouped server-side. Every mutation then
 * patches that copy in place rather than refetching, because a builder that
 * round-trips the whole trip on each keystroke feels broken. Only reorder and
 * delete refetch, and only because the server renumbers `order` for us.
 */
const TripBuilderPage = () => {
  const { id } = useParams();
  const { data: trip, loading, error, refresh, setData } = useAsync(() => tripApi.byId(id), [id]);

  usePageTitle(trip ? `Building ${trip.name}` : 'Itinerary builder');

  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(0);
  /** Server `warnings` keyed by stop or activity id — advisories, never failures. */
  const [notices, setNotices] = useState({});
  const [adding, setAdding] = useState(false);
  const [pickerStopId, setPickerStopId] = useState(null);
  const [confirmStop, setConfirmStop] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const stops = useMemo(() => trip?.stops || [], [trip?.stops]);
  const totals = useMemo(() => tripCost(stops), [stops]);
  const pickerStop = stops.find((stop) => sameId(stop._id, pickerStopId));

  const run = useCallback(async (task) => {
    setPending((count) => count + 1);
    setSaveError(null);
    try {
      return await task();
    } catch (failure) {
      setSaveError(toApiError(failure).message);
      return null;
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  const setNotice = useCallback((entityId, warnings) => {
    setNotices((current) => {
      const next = { ...current };
      if (warnings?.length > 0) next[entityId] = warnings;
      else delete next[entityId];
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- stops */

  // Written on the keystroke so the running total moves with the input rather
  // than 600ms behind it, once the debounced request has come back.
  const draftStop = useCallback(
    (stopId, patch) =>
      setData((current) => ({
        ...current,
        stops: current.stops.map((stop) => (sameId(stop._id, stopId) ? { ...stop, ...patch } : stop)),
      })),
    [setData]
  );

  const saveStop = useCallback(
    (stopId, patch) =>
      run(async () => {
        const { warnings } = await stopApi.update(id, stopId, patch);
        // The response echoes back what was sent, so the optimistic value
        // already IS the saved value; merging it again would only race a
        // keystroke that landed while the request was in flight. The warnings
        // are the one thing the response actually adds.
        setNotice(stopId, warnings);
        return true;
      }),
    [id, run, setNotice]
  );

  const addStop = useCallback(
    (payload) =>
      run(async () => {
        const { stop, warnings } = await stopApi.create(id, payload);
        setNotice(stop._id, warnings);
        // A write does not populate the `activities` virtual, so give the new
        // stop the empty array the rest of the screen expects to find.
        setData((current) => ({ ...current, stops: [...current.stops, { ...stop, activities: [] }] }));
        return stop;
      }),
    [id, run, setNotice, setData]
  );

  const moveStop = useCallback(
    async (stopId, direction) => {
      const from = stops.findIndex((stop) => sameId(stop._id, stopId));
      const to = from + direction;
      if (from < 0 || to < 0 || to >= stops.length) return;

      const moved = [...stops];
      [moved[from], moved[to]] = [moved[to], moved[from]];
      setData((current) => ({ ...current, stops: moved }));

      setPending((count) => count + 1);
      setSaveError(null);
      try {
        // A partial list is rejected outright, so every id on the trip goes.
        const items = await stopApi.reorder(id, moved.map((stop) => String(stop._id)));
        // The re-sequenced stops come back lean, without their activities —
        // reattach what is already on screen instead of refetching the trip.
        const activitiesById = new Map(
          moved.map((stop) => [String(stop._id), stop.activities || []])
        );
        setData((current) => ({
          ...current,
          stops: items.map((stop) => ({
            ...stop,
            activities: activitiesById.get(String(stop._id)) || [],
          })),
        }));
      } catch (failure) {
        setSaveError(toApiError(failure).message);
        setData((current) => ({ ...current, stops }));
      } finally {
        setPending((count) => count - 1);
      }
    },
    [id, stops, setData]
  );

  const removeStop = useCallback(async () => {
    if (!confirmStop) return;

    setDeleting(true);
    const removed = await run(() => stopApi.remove(id, confirmStop._id));
    setDeleting(false);
    setConfirmStop(null);
    setNotice(confirmStop._id, null);
    // The server closes the gap in `order`, so its list is the authority now.
    if (removed) refresh();
  }, [confirmStop, id, run, setNotice, refresh]);

  /* ----------------------------------------------------------- activities */

  const draftActivity = useCallback(
    (activityId, patch) =>
      setData((current) => ({
        ...current,
        stops: current.stops.map((stop) => {
          if (!stop.activities?.some((entry) => sameId(entry._id, activityId))) return stop;
          return {
            ...stop,
            activities: stop.activities
              .map((entry) => (sameId(entry._id, activityId) ? { ...entry, ...patch } : entry))
              // A changed date moves the row into a different day group.
              .sort(byDateThenOrder),
          };
        }),
      })),
    [setData]
  );

  const saveActivity = useCallback(
    (activityId, patch) =>
      run(async () => {
        const { warnings } = await tripActivityApi.update(id, activityId, patch);
        setNotice(activityId, warnings);
        return true;
      }),
    [id, run, setNotice]
  );

  const addActivity = useCallback(
    (payload) =>
      run(async () => {
        const { activity, warnings } = await tripActivityApi.create(id, payload);
        setNotice(activity._id, warnings);
        setData((current) => ({
          ...current,
          stops: current.stops.map((stop) =>
            sameId(stop._id, payload.stopId)
              ? { ...stop, activities: [...(stop.activities || []), activity].sort(byDateThenOrder) }
              : stop
          ),
        }));
        return activity;
      }),
    [id, run, setNotice, setData]
  );

  const moveActivity = useCallback(
    (dayIds, activityId, direction) =>
      run(async () => {
        const from = dayIds.indexOf(String(activityId));
        const to = from + direction;
        if (from < 0 || to < 0 || to >= dayIds.length) return null;

        const ordered = [...dayIds];
        [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

        // Unlike stops, this endpoint takes one day's ids — but it answers with
        // every activity on the trip, so regroup the whole lot from it.
        const items = await tripActivityApi.reorder(id, ordered);
        setData((current) => ({
          ...current,
          stops: current.stops.map((stop) => ({
            ...stop,
            activities: items.filter((entry) => sameId(entry.stop, stop._id)),
          })),
        }));
        return true;
      }),
    [id, run, setData]
  );

  const removeActivity = useCallback(
    async (activity) => {
      setData((current) => ({
        ...current,
        stops: current.stops.map((stop) => ({
          ...stop,
          activities: (stop.activities || []).filter((entry) => !sameId(entry._id, activity._id)),
        })),
      }));
      setNotice(activity._id, null);

      await run(() => tripActivityApi.remove(id, activity._id));
      // Unconditional: if the delete failed, the row has to come back.
      refresh();
    },
    [id, run, setNotice, setData, refresh]
  );

  const closePicker = useCallback(() => setPickerStopId(null), []);

  const applyTripUpdate = useCallback(
    (updated) =>
      setData((current) =>
        current ? { ...current, ...updated, stops: current.stops } : current
      ),
    [setData]
  );

  return (
    <>
      <PageHeader
        image={trip?.coverPhotoUrl || BANNERS.builder}
        kicker="Building"
        title={trip?.name || 'Itinerary builder'}
        sub="Add the cities, give each one a window and a budget, then hang the days off them."
        breadcrumb={[
          { label: 'My trips', to: ROUTES.trips },
          ...(trip ? [{ label: trip.name, to: ROUTES.trip(id) }] : []),
          { label: 'Build' },
        ]}
        actions={
          <>
            <Button to={ROUTES.trip(id)} variant="light" leftIcon={<Route className="size-4" />}>
              View itinerary
            </Button>
            <Button
              to={ROUTES.tripBudget(id)}
              variant="glass"
              leftIcon={<Wallet className="size-4" />}
            >
              Budget
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {error && (
          <Alert tone="error" title="This trip could not be loaded" className="mb-6">
            {error.message}
          </Alert>
        )}

        {loading && !trip && (
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, index) => (
              <StopCardSkeleton key={index} />
            ))}
          </div>
        )}

        {trip && (
          <div className="space-y-6">
            <TripSettings trip={trip} onChange={applyTripUpdate} />

            <CostSummary
              trip={trip}
              totals={totals}
              stopCount={stops.length}
              saving={pending > 0}
            />

            {saveError && <Alert tone="error">{saveError}</Alert>}

            {stops.length === 0 && !adding ? (
              <EmptyState
                icon={Compass}
                title="No cities on this trip yet"
                description="Every itinerary starts with a place and a window. Add the first city and the days follow."
                action={
                  <Button size="lg" onClick={() => setAdding(true)} leftIcon={<Plus className="size-4" />}>
                    Add the first city
                  </Button>
                }
              />
            ) : (
              <>
                <div className="space-y-4">
                  {stops.map((stop, index) => (
                    <StopCard
                      key={stop._id}
                      trip={trip}
                      stop={stop}
                      index={index}
                      stopCount={stops.length}
                      warnings={notices[stop._id]}
                      activityNotices={notices}
                      onDraft={draftStop}
                      onSave={saveStop}
                      onMove={moveStop}
                      onDelete={setConfirmStop}
                      onAddActivity={(target) => setPickerStopId(String(target._id))}
                      onActivityDraft={draftActivity}
                      onActivitySave={saveActivity}
                      onActivityMove={moveActivity}
                      onActivityDelete={removeActivity}
                    />
                  ))}
                </div>

                <AddStopPanel
                  trip={trip}
                  stops={stops}
                  open={adding}
                  onOpen={() => setAdding(true)}
                  onClose={() => setAdding(false)}
                  onAdd={addStop}
                />
              </>
            )}
          </div>
        )}
      </div>

      {trip && pickerStop && (
        <ActivityPicker
          key={pickerStop._id}
          trip={trip}
          stop={pickerStop}
          onAdd={addActivity}
          onClose={closePicker}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmStop)}
        title={`Remove ${confirmStop?.city?.name || 'this stop'}?`}
        description={
          confirmStop
            ? `${pluralise(confirmStop.activities?.length || 0, 'activity', 'activities')} planned there will be deleted with it. This cannot be undone.`
            : ''
        }
        confirmLabel="Remove stop"
        loading={deleting}
        onConfirm={removeStop}
        onCancel={() => setConfirmStop(null)}
      />
    </>
  );
};

export default TripBuilderPage;
