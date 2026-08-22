import { useEffect, useState } from 'react';

import { cityApi } from '../api/city.api.js';
import { toApiError } from '../api/client.js';

/**
 * Cities straight from the catalog, for screens that need to *submit* a city id.
 *
 * Unlike usePopularCities this deliberately has no offline fallback: those
 * placeholder cities carry made-up ids, and letting someone pick one would send
 * an id the API cannot resolve. An honest "catalog unavailable" beats a form
 * that fails on submit.
 *
 * Loading is derived from the key the last result was fetched under — see the
 * note in useTrips for why.
 */
export const useCityCatalog = ({ search = '', limit = 12 } = {}) => {
  const term = search.trim();
  const key = `${term}#${limit}`;

  const [result, setResult] = useState({ key: null, cities: [], error: null });

  useEffect(() => {
    let cancelled = false;

    const request = term
      ? cityApi.list({ search: term, limit, sort: 'popularity' }).then((data) => data.items)
      : cityApi.popular(limit);

    request
      .then((items) => {
        if (!cancelled) setResult({ key, cities: items || [], error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, cities: [], error: toApiError(error) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { cities: result.cities, loading: result.key !== key, error: result.error };
};
