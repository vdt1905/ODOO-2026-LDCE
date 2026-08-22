import { useCallback, useEffect, useRef } from 'react';

/**
 * Collects field edits and sends them as one patch once typing stops.
 *
 * Typing "420" into a cost box fires three change events. Without this that is
 * three PATCHes racing each other, and whichever lands last wins regardless of
 * the order they were sent in. Keys accumulate inside the window, so editing
 * arrival and departure together sends one request carrying both — which is
 * also what the strict update schema wants: only the keys that changed.
 */
export const useDebouncedPatch = (commit, delay = 600) => {
  const pending = useRef({});
  const timer = useRef(null);

  // Read through a ref so a new inline `commit` on every render does not
  // reset the timer that is currently counting down. Written in an effect
  // rather than during render — a render can be thrown away, and the ref
  // would keep the discarded closure.
  const latest = useRef(commit);
  useEffect(() => {
    latest.current = commit;
  });

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = null;

    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length > 0) latest.current(patch);
  }, []);

  const queue = useCallback(
    (partial) => {
      pending.current = { ...pending.current, ...partial };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, delay);
    },
    [delay, flush]
  );

  // Leaving the screen mid-edit must not throw the edit away. Blur has usually
  // drained the queue already, so this only catches keyboard navigation.
  useEffect(() => flush, [flush]);

  return { queue, flush };
};
