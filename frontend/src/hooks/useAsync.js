import { useCallback, useEffect, useState } from 'react';

import { toApiError } from '../api/client.js';

/**
 * Fetch-on-key-change, the generic form of the pattern in useTrips.
 *
 * Loading is *derived*, not a separate flag: the result carries the key of the
 * request that produced it, so anything that has not caught up with the current
 * key is by definition still in flight. That also makes a slow early response
 * harmless — it can never repaint with results for a key you have moved on from,
 * which a naive `setLoading(false)` in a `.finally()` gets wrong.
 *
 *   const { data, loading, error, refresh } = useAsync(
 *     () => activityApi.list(params),
 *     [JSON.stringify(params)]
 *   );
 *
 * `deps` must serialise to a stable string — pass primitives or a JSON string,
 * never a fresh object literal, or this refetches on every render.
 *
 * Deliberately not TanStack Query: nothing here needs a cache that outlives the
 * screen, and the whole hook is smaller than the adapter would be.
 */
export const useAsync = (fetcher, deps = [], { enabled = true, initial = null } = {}) => {
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const key = `${JSON.stringify(deps)}#${nonce}`;

  const [result, setResult] = useState({ key: null, data: initial, error: null });

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, data: initial, error: toApiError(error) });
      });

    return () => {
      cancelled = true;
    };
    // `key` already encodes deps + nonce; listing `fetcher` too would re-run on
    // every render, since callers pass an inline arrow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return {
    data: enabled ? result.data : initial,
    error: enabled ? result.error : null,
    loading: enabled && result.key !== key,
    refresh,
    /** Patch the local copy after a mutation instead of round-tripping. */
    setData: useCallback(
      (updater) =>
        setResult((current) => ({
          ...current,
          data: typeof updater === 'function' ? updater(current.data) : updater,
        })),
      []
    ),
  };
};
