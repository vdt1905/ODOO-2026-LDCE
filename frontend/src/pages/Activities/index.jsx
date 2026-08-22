import { ArrowDownUp, Compass, SearchX, X } from 'lucide-react';

import { activityApi } from '../../api/activity.api.js';
import { cityApi } from '../../api/city.api.js';
import { cn } from '../../lib/cn.js';
import {
  ACTIVITY_SORTS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_META,
  BANNERS,
} from '../../lib/constants.js';
import { formatCurrency, formatDuration, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useFilterParams } from '../../hooks/useFilterParams.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { BannerSearch } from '../../components/search/BannerSearch.jsx';
import { Pagination } from '../../components/search/Pagination.jsx';
import { Alert, Button, EmptyState, Select } from '../../components/ui/index.js';
import { ActivityResultCard, ActivityResultCardSkeleton } from './ActivityResultCard.jsx';
import { RangeFilter } from './RangeFilter.jsx';

const PAGE_SIZE = 12;

// Module scope — see the note in useFilterParams.
const DEFAULTS = {
  search: '',
  city: '',
  type: '',
  maxCost: '',
  maxDuration: '',
  sort: 'rating',
  page: 1,
};

// Only shown until the first response lands, which carries the real list.
// `custom` is dropped: the server stamps it on free-text entries and it is not
// in the catalog's enum, so nothing would ever match it.
const FALLBACK_TYPES = ACTIVITY_TYPES.filter((type) => type.value !== 'custom').map(
  (type) => type.value
);

const TypeChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
      active
        ? 'border-brand-500 bg-brand-500 text-white'
        : 'border-line bg-canvas text-ink-700 hover:border-line-strong hover:bg-canvas-deep'
    )}
  >
    {children}
  </button>
);

/**
 * Activity search — the public catalog of things to do.
 *
 * Filters live in the query string so a narrowed view is linkable; the city
 * filter in particular arrives that way, from the "all things to do here" link
 * on a destination.
 */
const ActivitiesPage = () => {
  usePageTitle('Activities');

  const [filters, setFilters] = useFilterParams(DEFAULTS);

  // An empty param means no ceiling; 0 is a real one ("free only"), which is
  // why this is null-vs-number rather than a falsy check.
  const maxCost = filters.maxCost === '' ? null : Number(filters.maxCost);
  const maxDuration = filters.maxDuration === '' ? null : Number(filters.maxDuration);

  const query = {
    ...(filters.search && { search: filters.search }),
    ...(filters.city && { city: filters.city }),
    ...(filters.type && { type: filters.type }),
    ...(maxCost !== null && { maxCost }),
    ...(maxDuration !== null && { maxDuration }),
    sort: filters.sort,
    page: filters.page,
    limit: PAGE_SIZE,
  };

  const { data, loading, error } = useAsync(() => activityApi.list(query), [JSON.stringify(query)]);

  // The slider ceilings are catalog-wide constants, so they are fetched once
  // and never move as the results narrow.
  const { data: meta } = useAsync(() => activityApi.meta(), []);

  const items = data?.items || [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  /**
   * `types` ships on every list response, so the chips need no /meta call. The
   * fallback covers the in-flight window only — `data` is null while a request
   * is running, and reading it straight would collapse the chip row and shove
   * the grid up the page on every filter change.
   */
  const types = data?.types?.length ? data.types : FALLBACK_TYPES;

  /**
   * The city filter arrives as a bare id, from a destination's "all things to
   * do" link. Its name is fetched rather than read off the first result: the
   * results reload on every filter change and the chip would blank out with
   * them, while this is keyed on the id alone and holds still.
   */
  const { data: filterCity } = useAsync(() => cityApi.byId(filters.city), [filters.city], {
    enabled: Boolean(filters.city),
  });

  const costCeiling = meta?.maxCost ?? 0;
  const durationCeiling = meta?.maxDuration ?? 0;

  const isFiltered = Boolean(
    filters.search || filters.city || filters.type || maxCost !== null || maxDuration !== null
  );

  const clearFilters = () =>
    setFilters({ search: '', city: '', type: '', maxCost: '', maxDuration: '' });

  return (
    <>
      <PageHeader
        image={BANNERS.activities}
        kicker="Things to do"
        title="Activities"
        sub="The catalog every itinerary is built from — filter by type, price and how much of the day it eats."
      >
        <BannerSearch
          value={filters.search}
          onChange={(search) => setFilters({ search })}
          label="Search activities"
          placeholder="Search things to do — museums, hikes, night markets"
        />
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section
          aria-label="Filter activities"
          className="rounded-3xl border border-line bg-surface p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              {loading ? 'Searching…' : pluralise(total, 'activity', 'activities')}
              {isFiltered && !loading && ' match your filters'}
            </p>

            <Select
              size="sm"
              icon={ArrowDownUp}
              aria-label="Sort activities"
              value={filters.sort}
              onChange={(event) => setFilters({ sort: event.target.value })}
              options={ACTIVITY_SORTS}
              wrapperClassName="w-full sm:w-56"
            />
          </div>

          {/* Single-select, not multi: the API takes one `type`, and chips that
              look multi-select but silently keep only the last pick are worse
              than chips that never pretended. */}
          <div className="mt-4 flex flex-wrap gap-2">
            <TypeChip active={!filters.type} onClick={() => setFilters({ type: '' })}>
              Everything
            </TypeChip>
            {types.map((type) => {
              const typeMeta = ACTIVITY_TYPE_META[type];
              return (
                <TypeChip
                  key={type}
                  active={filters.type === type}
                  onClick={() => setFilters({ type: filters.type === type ? '' : type })}
                >
                  <span aria-hidden>{typeMeta?.emoji}</span>
                  {typeMeta?.label || type}
                </TypeChip>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <RangeFilter
              label="Max cost"
              value={maxCost ?? costCeiling}
              max={costCeiling}
              step={5}
              disabled={!costCeiling}
              format={(value) => (value > 0 ? formatCurrency(value) : 'Free only')}
              onCommit={(value) => setFilters({ maxCost: value >= costCeiling ? '' : value })}
            />
            <RangeFilter
              label="Max duration"
              value={maxDuration ?? durationCeiling}
              max={durationCeiling}
              step={15}
              disabled={!durationCeiling}
              format={(value) => (value > 0 ? formatDuration(value) : 'Under 15m')}
              onCommit={(value) =>
                setFilters({ maxDuration: value >= durationCeiling ? '' : value })
              }
            />
          </div>

          {(filters.city || isFiltered) && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              {filters.city && (
                <button
                  type="button"
                  onClick={() => setFilters({ city: '' })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                >
                  In {filterCity?.name || 'one destination'}
                  <X className="size-3.5" aria-hidden />
                  <span className="sr-only">Remove the destination filter</span>
                </button>
              )}
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
          )}
        </section>

        {error && (
          <Alert tone="error" title="Activities could not be loaded" className="mt-6">
            {error.message}
          </Alert>
        )}

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ActivityResultCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((activity) => (
                  <ActivityResultCard key={activity._id} activity={activity} />
                ))}
              </div>

              <Pagination
                page={filters.page}
                pages={pages}
                onChange={(page) => setFilters({ page })}
                label="Activity results"
              />
            </>
          ) : (
            !error &&
            (isFiltered ? (
              <EmptyState
                compact
                icon={SearchX}
                title="Nothing matches those filters"
                description="Loosen the price or the duration, pick a different type, or clear the filters to see the whole catalog."
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
                description="Run `npm run seed` in the backend to load the starter cities and everything there is to do in them."
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ActivitiesPage;
