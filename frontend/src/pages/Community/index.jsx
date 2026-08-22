import { useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight, Compass, Search, SearchX, X } from 'lucide-react';

import { publicApi } from '../../api/public.api.js';
import { BANNERS, COMMUNITY_SORTS, ROUTES } from '../../lib/constants.js';
import { formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Alert, Button, EmptyState, Select } from '../../components/ui/index.js';
import { CommunityCard, CommunityCardSkeleton } from './CommunityCard.jsx';

const PAGE_SIZE = 12;

/**
 * Community — every itinerary somebody chose to publish.
 *
 * No auth anywhere on this screen, so nothing here may read the auth store or
 * call an endpoint that needs a token.
 */
const CommunityPage = () => {
  usePageTitle('Community');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);

  // Reset on the raw input rather than in an effect on the debounced value:
  // waiting for the debounce would fire one request for the old page first.
  const changeSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const changeSort = (value) => {
    setSort(value);
    setPage(1);
  };

  const { data, loading, error } = useAsync(
    () =>
      publicApi.list({
        search: debouncedSearch || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      }),
    [debouncedSearch, sort, page]
  );

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;
  const searching = Boolean(debouncedSearch.trim());

  return (
    <>
      <PageHeader
        image={BANNERS.community}
        kicker="Shared by travellers"
        title="Community"
        sub="Real itineraries, published by the people who planned them. Open one, read it day by day, and copy it onto your own account."
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-300"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search shared itineraries"
              aria-label="Search shared itineraries"
              className="h-10 w-full rounded-full border border-line bg-canvas pr-10 pl-10 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/12"
            />
            {search && (
              <button
                type="button"
                onClick={() => changeSearch('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>

          <Select
            size="sm"
            icon={ArrowDownUp}
            aria-label="Sort shared itineraries"
            value={sort}
            onChange={(event) => changeSort(event.target.value)}
            options={COMMUNITY_SORTS}
            wrapperClassName="lg:w-56"
          />
        </div>

        <p className="mt-5 text-sm text-ink-500">
          {loading
            ? 'Loading shared itineraries…'
            : total === 0
              ? 'Nothing published yet'
              : `${formatNumber(total)} ${total === 1 ? 'itinerary' : 'itineraries'}${searching ? ` matching “${debouncedSearch.trim()}”` : ' shared so far'}`}
        </p>

        {error && (
          <Alert tone="error" title="The feed could not be loaded" className="mt-5">
            {error.message}
          </Alert>
        )}

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <CommunityCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <EmptyState
            className="mt-6"
            icon={searching ? SearchX : Compass}
            title={searching ? 'No itineraries match that' : 'Nothing shared yet'}
            description={
              searching
                ? 'Search matches trip names only. Try a shorter spelling, or clear it to see everything.'
                : 'Published trips show up here. Plan one, hit Share, and it joins the feed.'
            }
            action={
              searching ? (
                <Button variant="outline" onClick={() => changeSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button to={ROUTES.newTrip}>Plan a trip</Button>
              )
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((trip) => (
              <CommunityCard key={trip.publicSlug} trip={trip} />
            ))}
          </div>
        )}

        {pages > 1 && !loading && (
          <nav
            aria-label="Feed pages"
            className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              leftIcon={<ChevronLeft className="size-4" />}
            >
              Previous
            </Button>

            <p aria-live="polite" className="text-sm text-ink-500">
              Page {page} of {pages}
              <span className="sr-only"> · {pluralise(total, 'itinerary', 'itineraries')} in total</span>
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              rightIcon={<ChevronRight className="size-4" />}
            >
              Next
            </Button>
          </nav>
        )}
      </div>
    </>
  );
};

export default CommunityPage;
