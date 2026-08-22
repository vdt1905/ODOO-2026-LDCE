import { useCallback, useMemo, useState } from 'react';

import { ChromeContext } from './chromeContext.js';

/**
 * Whether the current screen has a dark photographic header for the navbar to
 * float over.
 *
 * The navbar renders white-on-transparent at scroll-top, which is only legible
 * against an image. A route list would answer this, but it would silently rot
 * the first time someone adds a page and forgets to update it — so the header
 * component itself registers instead, and the answer cannot drift from reality.
 *
 * A counter rather than a boolean: during a route change React can mount the
 * next header before unmounting the previous one, and two booleans racing would
 * leave the nav stuck in the wrong mode.
 */
export const ChromeProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  // Stable across renders. If `register` changed identity whenever `count` did,
  // the effect below would tear down and re-run on its own state change — an
  // infinite loop rather than a subscription.
  const register = useCallback(() => {
    setCount((n) => n + 1);
    return () => setCount((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(() => ({ immersive: count > 0, register }), [count, register]);

  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
};
