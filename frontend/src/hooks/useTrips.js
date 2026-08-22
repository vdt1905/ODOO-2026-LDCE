import { useCallback, useEffect, useMemo, useState } from 'react';

import { tripApi } from '../api/trip.api.js';
import { toApiError } from '../api/client.js';

/**
 * The signed-in user's trips, filtered and sorted by the server.
 *
 * `filter` is the single control the UI exposes; it collapses the API's
 * `status` and `visibility` params into one dropdown, because "Shared
 * publicly" belongs in the same list as "Upcoming" from the user's point of
 * view even though the server treats them as different axes.
 *
 * Loading is *derived*: the result carries the key of the request that
 * produced it, so anything that has not caught up with the current key is by
 * definition still in flight. That also makes a slow early response harmless —
 * it can never repaint the list with results for a filter you have moved on
 * from. Same shape as usePopularCities, so this family can move to TanStack
 * Query in one commit when trip data outgrows it.
 */
export const useTrips = ({ search = '', filter = 'all', sort = 'start-asc', limit = 24 } = {}) => {
  // Bumped to force a refetch after something else on the page mutates a trip.
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const params = useMemo(() => {
    const next = { sort, limit, search: search || undefined };
    if (filter === 'public') next.visibility = 'public';
    else if (filter !== 'all') next.status = filter;
    return next;
  }, [search, filter, sort, limit]);

  const key = `${JSON.stringify(params)}#${nonce}`;

  const [result, setResult] = useState({ key: null, trips: [], total: 0, error: null });

  useEffect(() => {
    let cancelled = false;

    tripApi
      .list(params)
      .then((data) => {
        if (!cancelled) setResult({ key, trips: data.items, total: data.total, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, trips: [], total: 0, error: toApiError(error) });
      });

    return () => {
      cancelled = true;
    };
    // `key` is the serialised form of `params`; listing both would re-run twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** Optimistic removal — the card disappears as soon as the server confirms. */
  const removeTrip = useCallback(async (id) => {
    try {
      await tripApi.remove(id);
      setResult((current) => ({
        ...current,
        trips: current.trips.filter((trip) => trip._id !== id),
        total: Math.max(0, current.total - 1),
      }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: toApiError(error) };
    }
  }, []);

  return {
    trips: result.trips,
    total: result.total,
    error: result.error,
    loading: result.key !== key,
    refresh,
    removeTrip,
  };
};

/** Totals across every trip — deliberately unfiltered, unlike useTrips. */
export const useTripStats = () => {
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [result, setResult] = useState({ key: -1, stats: null });

  useEffect(() => {
    let cancelled = false;

    tripApi
      .summary()
      // A missing stats strip is a cosmetic loss; the trips below still render,
      // so a failure settles to null rather than surfacing an error banner.
      .then((stats) => !cancelled && setResult({ key: nonce, stats }))
      .catch(() => !cancelled && setResult({ key: nonce, stats: null }));

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { stats: result.stats, loading: result.key !== nonce, refresh };
};
