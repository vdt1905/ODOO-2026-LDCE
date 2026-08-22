import { useEffect, useState } from 'react';

/**
 * Delays a fast-changing value — a search box firing a request per keystroke
 * is the difference between one query and twenty.
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
