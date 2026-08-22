import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * List filters kept in the URL query string.
 *
 * The query string is the single source of truth, so a filtered view is a
 * linkable URL and survives a refresh — the alternative, useState, loses both
 * the moment someone reloads or shares the page.
 *
 * `defaults` doubles as the schema: a value equal to its default is dropped
 * from the URL, so `/cities` stays clean until something is actually filtered.
 * Define it at module scope — it is captured by the setter, and a fresh object
 * literal every render would make that setter unstable.
 */
export const useFilterParams = (defaults) => {
  const [params, setParams] = useSearchParams();
  const search = params.toString();

  const values = useMemo(() => {
    const query = new URLSearchParams(search);

    return Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => {
        const raw = query.get(key);
        if (raw === null || raw === '') return [key, fallback];
        // The default's type decides how the string is read back, so callers
        // never have to Number() a page number at the call site.
        return [key, typeof fallback === 'number' ? Number(raw) || fallback : raw];
      })
    );
  }, [search, defaults]);

  const setValues = useCallback(
    (patch) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === '' || value === defaults[key]) next.delete(key);
            else next.set(key, String(value));
          }

          // Any filter change invalidates the page number: page 3 of the old
          // result set is usually past the end of the new one.
          if (!('page' in patch)) next.delete('page');

          return next;
        },
        // Replace, not push — twenty keystrokes must not become twenty history
        // entries the back button has to walk out of before leaving the page.
        { replace: true }
      );
    },
    [setParams, defaults]
  );

  return [values, setValues];
};
