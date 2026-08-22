import { useEffect } from 'react';

const BASE = 'TRIPORA';

export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
  }, [title]);
};
