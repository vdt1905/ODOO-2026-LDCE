import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Compass,
  Globe2,
  MapPin,
  Plus,
  RefreshCw,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import { cityApi } from '../../api/city.api.js';
import { toApiError } from '../../api/client.js';
import { userApi } from '../../api/user.api.js';
import { BANNERS, CITY_SORTS, REGIONS, ROUTES } from '../../lib/constants.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useFilterParams } from '../../hooks/useFilterParams.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Section, SectionHeading } from '../../components/layout/Section.jsx';
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

/** The same small, wide, quiet label the form fields use, for groups of controls. */
const ControlLabel = ({ id, children }) => (
  <p id={id} className="text-[11px] font-semibold tracking-[0.09em] text-ink-700 uppercase">
    {children}
  </p>
);

/**
 * One active filter, shown as a pill you can click to take it off again.
 * The whole chip is the remove button — a tiny × target inside a chip is a
 * miss waiting to happen, and there is nothing else the chip could do.
 */
const FilterChip = ({ label, value, onRemove }) => (
  <button
    type="button"
    onClick={onRemove}
    aria-label={`Remove the ${label.toLowerCase()} filter`}
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pr-2.5 pl-3.5 text-xs text-ink-700 transition-colors hover:border-ember-300 hover:bg-ember-50 hover:text-ember-700"
  >
    <span className="text-ink-500">{label}</span>
    <span className="font-medium text-ink-900">{value}</span>
    <X className="size-3.5" aria-hidden />
  </button>
);

/**
 * City search — the public catalog of destinations.
 *
 * Filters live in the query string, so a narrowed view (`/cities?region=Asia`)
 * is a link someone can send, and a refresh does not throw the work away.
 */
const CitiesPage = () => {
  usePageTitle('Destinations');

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [filters, setFilters] = useFilterParams(DEFAULTS);
  const [selectedCity, setSelectedCity] = useState(null);
  const [savingCityId, setSavingCityId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const query = {
    ...(filters.search && { search: filters.search }),
    ...(filters.country && { country: filters.country }),
    ...(filters.region && { region: filters.region }),
    sort: filters.sort,
    page: filters.page,
    limit: PAGE_SIZE,
  };

  const { data, loading, error, refresh } = useAsync(
    () => cityApi.list(query),
    [JSON.stringify(query)]
  );

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
  const savedIds = useMemo(
    () => new Set((user?.savedDestinations || []).map((item) => String(item?._id || item))),
    [user?.savedDestinations]
  );

  const toggleSave = async (city) => {
    const current = useAuthStore.getState().user;
    if (!current) return;

    setSavingCityId(city._id);
    setSaveError(null);
    try {
      const items = savedIds.has(String(city._id))
        ? await userApi.unsaveDestination(city._id)
        : await userApi.saveDestination(city._id);
      setUser({
        ...current,
        savedDestinations: items.map((item) => String(item?._id || item)),
      });
    } catch (caught) {
      setSaveError(toApiError(caught).message);
    } finally {
      setSavingCityId(null);
    }
  };

  const clearFilters = () => setFilters({ search: '', country: '', region: '' });

  /**
   * "12 destinations in Portugal, Europe matching “lis”" — the one line that
   * tells you what you are looking at without re-reading the controls.
   */
  const place = [filters.country, filters.region].filter(Boolean).join(', ');
  const qualifier = [place && `in ${place}`, filters.search && `matching “${filters.search}”`]
    .filter(Boolean)
    .join(' ');
  const sortLabel = CITY_SORTS.find((option) => option.value === filters.sort)?.label;

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

      <Section tone="canvas">
        <SectionHeading
          eyebrow="The catalog"
          title="Pick a starting point"
          sub="Filter by region or country, open a city to see what it costs and what there is to do, then drop it straight into a trip."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" to={ROUTES.activities} leftIcon={<Sparkles className="size-4" />}>
                Things to do
              </Button>
              {user && (
                <Button to={ROUTES.newTrip} leftIcon={<Plus className="size-4" />}>
                  Plan a trip
                </Button>
              )}
            </div>
          }
        />

        {/* One grouped, labelled control bar — not a loose row of mystery pills. */}
        <div className="mt-10 space-y-4">
          <section
            aria-label="Filter destinations"
            className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-brand-500" aria-hidden />
              <ControlLabel>Narrow it down</ControlLabel>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Region"
                icon={Globe2}
                value={filters.region}
                onChange={(event) => setFilters({ region: event.target.value })}
                options={REGION_OPTIONS}
              />
              <Select
                label="Country"
                icon={MapPin}
                hint="Only the countries on this page — search by name to reach the rest."
                value={filters.country}
                onChange={(event) => setFilters({ country: event.target.value })}
                options={countryOptions}
              />
              <Select
                label="Order results"
                icon={ArrowDownUp}
                value={filters.sort}
                onChange={(event) => setFilters({ sort: event.target.value })}
                options={CITY_SORTS}
              />
            </div>
          </section>

          {isFiltered && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <ControlLabel>Filtering by</ControlLabel>
              {filters.search && (
                <FilterChip
                  label="Search"
                  value={filters.search}
                  onRemove={() => setFilters({ search: '' })}
                />
              )}
              {filters.region && (
                <FilterChip
                  label="Region"
                  value={filters.region}
                  onRemove={() => setFilters({ region: '' })}
                />
              )}
              {filters.country && (
                <FilterChip
                  label="Country"
                  value={filters.country}
                  onRemove={() => setFilters({ country: '' })}
                />
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                <X className="size-3.5" aria-hidden />
                Clear all
              </button>
            </div>
          )}
        </div>

        {error && (
          <Alert
            tone="error"
            title="Destinations could not be loaded"
            className="mt-8"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                leftIcon={<RefreshCw className="size-4" />}
              >
                Try again
              </Button>
            }
          >
            {error.message}
          </Alert>
        )}

        {saveError && (
          <Alert
            tone="error"
            title="That destination could not be updated"
            className="mt-8"
            action={
              <Button variant="ghost" size="sm" onClick={() => setSaveError(null)}>
                Dismiss
              </Button>
            }
          >
            {saveError}
          </Alert>
        )}

        <div className="mt-10 space-y-6">
          {/* The count sentence: what came back, for what search, in what order. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="inline-block h-7 w-14 animate-pulse rounded-lg bg-canvas-deep" />
                <span className="text-sm text-ink-500">Searching the catalog…</span>
              </span>
            ) : (
              <p className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-display text-3xl leading-none text-ink-900">{total}</span>
                <span className="text-sm text-ink-700">
                  {total === 1 ? 'destination' : 'destinations'}
                  {qualifier && ` ${qualifier}`}
                </span>
              </p>
            )}

            {!loading && total > 0 && (
              <p className="text-xs text-ink-500">Sorted by {sortLabel?.toLowerCase()}</p>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <CityResultCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((city) => (
                  <CityResultCard
                    key={city._id}
                    city={city}
                    onOpen={setSelectedCity}
                    isSaved={savedIds.has(String(city._id))}
                    saving={savingCityId === city._id}
                    onToggleSave={user ? toggleSave : undefined}
                  />
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
                  <Button variant="outline" onClick={clearFilters} leftIcon={<X className="size-4" />}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Compass}
                title="The catalog is empty"
                description="Run `npm run seed` in the backend to load the thirty starter cities and their activities."
                action={
                  <Button
                    variant="outline"
                    onClick={refresh}
                    leftIcon={<RefreshCw className="size-4" />}
                  >
                    Check again
                  </Button>
                }
              />
            ))
          )}
        </div>
      </Section>

      <CityDetailDialog
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
        canAddToTrip={Boolean(user)}
        isSaved={selectedCity ? savedIds.has(String(selectedCity._id)) : false}
        saving={selectedCity ? savingCityId === selectedCity._id : false}
        onToggleSave={toggleSave}
      />
    </>
  );
};

export default CitiesPage;
