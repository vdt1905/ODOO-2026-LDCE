import { useEffect, useState } from 'react';
import { cityApi } from '../api/city.api.js';
import { FALLBACK_CITIES } from '../lib/constants.js';

/**
 * Popular cities for the landing rail.
 *
 * If the API is unreachable it falls back to a bundled list rather than
 * rendering an empty section — a blank hero section reads as a broken app.
 *
 * (When trip data lands, move this and its siblings to TanStack Query; this
 * hook keeps the same shape so the swap is local.)
 */
export const usePopularCities = (limit = 8) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    cityApi
      .popular(limit)
      .then((items) => {
        if (cancelled) return;
        setCities(items?.length ? items : FALLBACK_CITIES);
        setOffline(!items?.length);
      })
      .catch(() => {
        if (cancelled) return;
        setCities(FALLBACK_CITIES);
        setOffline(true);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { cities, loading, offline };
};
