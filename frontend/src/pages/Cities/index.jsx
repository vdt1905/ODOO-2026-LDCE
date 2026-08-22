import { useMemo, useState } from 'react';
import { ArrowDownUp, Compass, Globe2, MapPin, SearchX, X } from 'lucide-react';

import { cityApi } from '../../api/city.api.js';
import { BANNERS, CITY_SORTS, REGIONS } from '../../lib/constants.js';
import { pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useFilterParams } from '../../hooks/useFilterParams.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { BannerSearch } from '../../components/search/BannerSearch.jsx';
import { Pagination } from '../../components/search/Pagination.jsx';
import { Alert, Button, EmptyState, Select } from '../../components/ui/index.js';
import { CityResultCard, CityResultCardSkeleton } from './CityResultCard.jsx';
import { CityDetailDialog } from './CityDetailDialog.jsx';

const PAGE_SIZE = 12;

// Module scope: useFilterParams captures this, and a fresh literal every render
// would make its setter change identity on every render.
const DEFAULTS = { search: '', country: '', region: '', sort: 'popularity', page: 1 };

const REGION_OPTIONS = [
  { value: '', label: 'All regions' },
  ...REGIONS.map((region) => ({ value: region, label: region })),
];

/**
 * City search — the public catalog of destinations.
 *
 * Filters live in the query string, so a narrowed view (`/cities?region=Asia`)
 * is a link someone can send, and a refresh does not throw the work away.
 */
const CitiesPage = () => {
  usePageTitle('Destinations');

  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useFilterParams(DEFAULTS);
  const [selectedCity, setSelectedCity] = useState(null);

  const query = {
    ...(filters.search && { search: filters.search }),
    ...(filters.country && { country: filters.country }),
    ...(filters.region && { region: filters.region }),
    sort: filters.sort,
    page: filters.page,
    limit: PAGE_SIZE,
  };

  const { data, loading, error } = useAsync(() => cityApi.list(query), [JSON.stringify(query)]);

  // Memoised so the empty-array fallback is not a fresh reference every render,
  // which would rebuild the country list below on every keystroke.
  const items = useMemo(() => data?.items || [], [data]);
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  /**
   * There is no meta endpoint for cities, so this is only ever the countries on
   * the page in front of you — never the whole catalog. The active selection is
   * folded back in so paging to a result set without it does not silently drop
   * the filter out of the control that is applying it.
   */
  const countryOptions = useMemo(() => {
    const found = new Set(items.map((city) => city.country).filter(Boolean));
    if (filters.country) found.add(filters.country);

    return [
      { value: '', label: 'All countries' },
      ...[...found].sort().map((country) => ({ value: country, label: country })),
    ];
  }, [items, filters.country]);

  const isFiltered = Boolean(filters.search || filters.country || filters.region);

  const clearFilters = () => setFilters({ search: '', country: '', region: '' });

  return (
    <>
      <PageHeader
        image={BANNERS.cities}
        kicker="Where to next"
        title="Destinations"
        sub="Thirty-odd cities with a cost index, a crowd level, and a shortlist of what to do when you land."
      >
        <BannerSearch
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          label="Search destinations"
          placeholder="Search by city — Kyoto, Lisbon, Cape Town"
        />
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="px-1 text-sm text-ink-500 lg:px-2">
            {loading ? 'Searching…' : pluralise(total, 'destination')}
            {isFiltered && !loading && ' match your filters'}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select
              size="sm"
              icon={Globe2}
              aria-label="Filter by region"
              value={filters.region}
              onChange={(event) => setFilters({ region: event.target.value })}
              options={REGION_OPTIONS}
            />
            <Select
              size="sm"
              icon={MapPin}
              aria-label="Filter by country"
              value={filters.country}
              onChange={(event) => setFilters({ country: event.target.value })}
              options={countryOptions}
            />
            <Select
              size="sm"
              icon={ArrowDownUp}
              aria-label="Sort destinations"
              value={filters.sort}
              onChange={(event) => setFilters({ sort: event.target.value })}
              options={CITY_SORTS}
            />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 sm:px-3">
          <p className="text-xs text-ink-500">
            The country list only covers the destinations on this page — search by name to reach
            the rest.
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              <X className="size-3.5" aria-hidden />
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <Alert tone="error" title="Destinations could not be loaded" className="mt-6">
            {error.message}
          </Alert>
        )}

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <CityResultCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((city) => (
                  <CityResultCard key={city._id} city={city} onOpen={setSelectedCity} />
                ))}
              </div>

              <Pagination
                page={filters.page}
                pages={pages}
                onChange={(page) => setFilters({ page })}
                label="Destination results"
              />
            </>
          ) : (
            !error &&
            (isFiltered ? (
              <EmptyState
                compact
                icon={SearchX}
                title="No destinations match that"
                description="Try a shorter spelling, a different region, or clear the filters to see the whole catalog."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Compass}
                title="The catalog is empty"
                description="Run `npm run seed` in the backend to load the thirty starter cities and their activities."
              />
            ))
          )}
        </div>
      </div>

      <CityDetailDialog
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
        canAddToTrip={Boolean(user)}
      />
    </>
  );
};

export default CitiesPage;
