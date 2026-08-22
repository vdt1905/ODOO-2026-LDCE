import { useEffect } from 'react';

const BASE = 'GlobeTrotter';

export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
  }, [title]);
};
