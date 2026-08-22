import { createContext, useContext, useEffect } from 'react';

export const ChromeContext = createContext({ immersive: false, register: () => () => {} });

export const useChrome = () => useContext(ChromeContext);

/** Called by any header that puts an image behind the navbar. */
export const useImmersiveHeader = () => {
  const { register } = useChrome();

  useEffect(() => register(), [register]);
};
