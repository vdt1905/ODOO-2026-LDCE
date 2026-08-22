import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';

/**
 * The prominent search bar the dashboard mockup puts under the banner.
 *
 * On the signed-out hero it hands the query to city search rather than
 * filtering in place — there is nothing personal to filter yet, and the
 * catalog is the honest answer to "where can I go?".
 */
export const HeroSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `${ROUTES.cities}?search=${encodeURIComponent(trimmed)}` : ROUTES.cities);
  };

  return (
    <form onSubmit={submit} role="search" className="relative mx-auto w-full max-w-xl">
      <Search
        className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-ink-300"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Where to? Try Kyoto, Portugal, or somewhere warm"
        aria-label="Search destinations"
        className="h-14 w-full rounded-full border border-white/30 bg-surface/95 pr-32 pl-13 text-sm text-ink-900 shadow-lift transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-sm font-medium text-canvas transition-colors hover:bg-brand-600 hover:text-white"
      >
        Search
        <ArrowRight className="size-3.5" aria-hidden />
      </button>
    </form>
  );
};
