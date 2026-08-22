import { Check, MapPin, Plus, Search, SearchX, WifiOff, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { MAX_SEED_CITIES, gradientFor } from '../../lib/constants.js';
import { useCityCatalog } from '../../hooks/useCityCatalog.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Badge, EmptyState } from '../../components/ui/index.js';

/** Small selectable tile — the "Suggestions for places to visit" grid. */
const CityTile = ({ city, selected, disabled, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(city)}
    disabled={disabled && !selected}
    aria-pressed={selected}
    className={cn(
      'group relative aspect-[4/5] overflow-hidden rounded-2xl text-left transition-all duration-300',
      'disabled:cursor-not-allowed disabled:opacity-45',
      selected
        ? 'ring-3 ring-clay-500 ring-offset-2 ring-offset-surface'
        : 'hover:-translate-y-1 hover:shadow-lift'
    )}
  >
    {city.imageUrl ? (
      <img src={city.imageUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
    ) : (
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradientFor(city.name + city.country))} />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/20 to-transparent" />

    <span
      className={cn(
        'absolute top-2 right-2 grid size-7 place-items-center rounded-full transition-colors',
        selected ? 'bg-clay-500 text-white' : 'bg-white/25 text-white backdrop-blur-md'
      )}
      aria-hidden
    >
      {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
    </span>

    <span className="absolute inset-x-0 bottom-0 block p-3">
      <span className="block truncate font-display text-sm font-semibold text-white">
        {city.name}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/75">
        <MapPin className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{city.country}</span>
      </span>
    </span>
  </button>
);

const TileSkeleton = () => (
  <div className="aspect-[4/5] animate-pulse rounded-2xl bg-canvas-deep" />
);

/**
 * City picker for the Create Trip form.
 *
 * Selected cities are held as whole objects by the parent, not just ids, so the
 * chips keep their names after a search filters them out of the grid below.
 * The server turns this list into stops, in exactly this order.
 */
export const CitySuggestions = ({ selected, onToggle, onClear, search, onSearchChange, error }) => {
  const debounced = useDebouncedValue(search, 350);
  const { cities, loading, error: catalogError } = useCityCatalog({ search: debounced, limit: 12 });

  const selectedIds = new Set(selected.map((city) => city._id));
  const atLimit = selected.length >= MAX_SEED_CITIES;
  const searching = Boolean(debounced.trim());

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Suggestions for places to visit
          </h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-500">
            Tick the cities you already know you want. They become stops with dates and an
            opening budget the moment you save — you can reorder and edit every one later.
          </p>
        </div>
        <Badge tone={atLimit ? 'clay' : 'neutral'}>
          {selected.length} / {MAX_SEED_CITIES} picked
        </Badge>
      </div>

      {/* Chips: the itinerary order, and the only place a filtered-out pick
          can still be removed from. */}
      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selected.map((city, index) => (
            <span
              key={city._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 py-1 pr-1 pl-3 text-xs font-medium text-clay-700"
            >
              <span className="text-clay-500">{index + 1}</span>
              {city.name}
              <button
                type="button"
                onClick={() => onToggle(city)}
                aria-label={`Remove ${city.name}`}
                className="grid size-5 place-items-center rounded-full text-clay-600 transition-colors hover:bg-clay-200"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          >
            Clear all
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-clay-600">
          {error}
        </p>
      )}

      <div className="relative mt-5">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-300"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search the city catalog"
          aria-label="Search cities"
          className="h-11 w-full rounded-full border border-line bg-canvas pr-4 pl-11 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-clay-400 focus:bg-surface focus:ring-4 focus:ring-clay-500/12"
        />
      </div>

      {catalogError && !loading && (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
          <WifiOff className="size-3.5" aria-hidden />
          Cities could not be loaded — {catalogError.message} You can still create the trip and
          add stops later.
        </p>
      )}

      {!loading && !catalogError && cities.length === 0 && (
        <EmptyState
          compact
          className="mt-5"
          icon={SearchX}
          title={searching ? 'No cities match that' : 'The catalog is empty'}
          description={
            searching
              ? 'Try a country name, or a shorter spelling.'
              : 'Run `npm run seed` in the backend to load the starter cities.'
          }
        />
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <TileSkeleton key={i} />)
          : cities.map((city) => (
              <CityTile
                key={city._id}
                city={city}
                selected={selectedIds.has(city._id)}
                disabled={atLimit}
                onToggle={onToggle}
              />
            ))}
      </div>

      {atLimit && (
        <p className="mt-4 text-xs text-ink-500">
          That is the most you can add up front. Remove one, or add the rest from the builder.
        </p>
      )}
    </section>
  );
};
