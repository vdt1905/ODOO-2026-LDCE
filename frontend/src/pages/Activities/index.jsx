import { useId } from 'react';
import { ArrowDownUp, Compass, Globe2, RefreshCw, SearchX, SlidersHorizontal, X } from 'lucide-react';

import { activityApi } from '../../api/activity.api.js';
import { cityApi } from '../../api/city.api.js';
import { cn } from '../../lib/cn.js';
import {
  ACTIVITY_SORTS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_META,
  BANNERS,
  ROUTES,
} from '../../lib/constants.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useFilterParams } from '../../hooks/useFilterParams.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Section, SectionHeading } from '../../components/layout/Section.jsx';
import { BannerSearch } from '../../components/search/BannerSearch.jsx';
import { Pagination } from '../../components/search/Pagination.jsx';
import { Alert, Button, EmptyState, Select } from '../../components/ui/index.js';
import { ActivityResultCard, ActivityResultCardSkeleton } from './ActivityResultCard.jsx';
import { RangeFilter } from './RangeFilter.jsx';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

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

/** The same small, wide, quiet label the form fields use, for groups of controls. */
const ControlLabel = ({ id, children }) => (
  <p id={id} className="text-[11px] font-semibold tracking-[0.09em] text-ink-700 uppercase">
    {children}
  </p>
);

const TypeChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
      active
        ? 'border-brand-500 bg-brand-500 text-white'
        : 'border-line bg-canvas text-ink-700 hover:border-line-strong hover:bg-canvas-deep'
    )}
  >
    {children}
  </button>
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
 * Activity search — the public catalog of things to do.
 *
 * Filters live in the query string so a narrowed view is linkable; the city
 * filter in particular arrives that way, from the "all things to do here" link
 * on a destination.
 */
const ActivitiesPage = () => {
  usePageTitle('Activities');

  const [filters, setFilters] = useFilterParams(DEFAULTS);
  const typeLabelId = useId();

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

  const { data, loading, error, refresh } = useAsync(
    () => activityApi.list(query),
    [JSON.stringify(query)]
  );

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

  /**
   * "18 activities in Kyoto under $60 matching “temple”" — the one line that
   * tells you what you are looking at without re-reading the controls.
   */
  const typeLabel = filters.type ? ACTIVITY_TYPE_META[filters.type]?.label : null;
  // A ceiling of zero is "free only" / "under 15m", never "under $0".
  const costLabel = maxCost === 0 ? 'Free only' : formatCurrency(maxCost ?? 0);
  const durationLabel = maxDuration === 0 ? 'Under 15m' : formatDuration(maxDuration ?? 0);
  const qualifier = [
    filters.city && `in ${filterCity?.name || 'one destination'}`,
    maxCost !== null && (maxCost === 0 ? 'that are free' : `under ${costLabel}`),
    maxDuration !== null && (maxDuration === 0 ? 'under 15m long' : `up to ${durationLabel} long`),
    filters.search && `matching “${filters.search}”`,
  ]
    .filter(Boolean)
    .join(' ');
  const sortLabel = ACTIVITY_SORTS.find((option) => option.value === filters.sort)?.label;

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

      <Section tone="canvas">
        <SectionHeading
          eyebrow="The catalog"
          title="Find something to do"
          sub="Pick a kind of thing, cap what it costs and how long it takes. Everything here can be dropped straight onto a day of your trip."
          action={
            <Button variant="outline" to={ROUTES.cities} leftIcon={<Globe2 className="size-4" />}>
              Browse destinations
            </Button>
          }
        />

        {/* One grouped, labelled control bar — not a loose row of mystery pills. */}
        <div className="mt-10 space-y-4">
          <section
            aria-label="Filter activities"
            className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-brand-500" aria-hidden />
                <ControlLabel>Narrow it down</ControlLabel>
              </div>

              <Select
                label="Order results"
                icon={ArrowDownUp}
                value={filters.sort}
                onChange={(event) => setFilters({ sort: event.target.value })}
                options={ACTIVITY_SORTS}
                wrapperClassName="w-full sm:w-60"
              />
            </div>

            {/* Single-select, not multi: the API takes one `type`, and chips that
                look multi-select but silently keep only the last pick are worse
                than chips that never pretended. */}
            <div className="mt-6 border-t border-line-soft pt-5">
              <ControlLabel id={typeLabelId}>What kind of thing</ControlLabel>
              <div role="group" aria-labelledby={typeLabelId} className="mt-3 flex flex-wrap gap-2">
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
                      <ActivityIcon type={type} className="size-3.5" />
                      {typeMeta?.label || type}
                    </TypeChip>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-6 border-t border-line-soft pt-5 sm:grid-cols-2">
              <RangeFilter
                label="Most it can cost"
                hint="Slide left to cap the price. All the way right means no ceiling."
                value={maxCost ?? costCeiling}
                max={costCeiling}
                step={5}
                disabled={!costCeiling}
                format={(value) => (value > 0 ? formatCurrency(value) : 'Free only')}
                onCommit={(value) => setFilters({ maxCost: value >= costCeiling ? '' : value })}
              />
              <RangeFilter
                label="Most of the day it takes"
                hint="Slide left for quick stops. All the way right means no ceiling."
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
              {filters.city && (
                <FilterChip
                  label="Destination"
                  value={filterCity?.name || 'One destination'}
                  onRemove={() => setFilters({ city: '' })}
                />
              )}
              {filters.type && (
                <FilterChip
                  label="Type"
                  value={typeLabel || filters.type}
                  onRemove={() => setFilters({ type: '' })}
                />
              )}
              {maxCost !== null && (
                <FilterChip
                  label="Up to"
                  value={costLabel}
                  onRemove={() => setFilters({ maxCost: '' })}
                />
              )}
              {maxDuration !== null && (
                <FilterChip
                  label="No longer than"
                  value={durationLabel}
                  onRemove={() => setFilters({ maxDuration: '' })}
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
            title="Activities could not be loaded"
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
                  {total === 1 ? 'activity' : 'activities'}
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
                <ActivityResultCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Button variant="outline" onClick={clearFilters} leftIcon={<X className="size-4" />}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Compass}
                title="The catalog is empty"
                description="Run `npm run seed` in the backend to load the starter cities and everything there is to do in them."
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
    </>
  );
};

export default ActivitiesPage;
