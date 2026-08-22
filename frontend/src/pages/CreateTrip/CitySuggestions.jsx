import { useState } from 'react';
import { Check, MapPin, Plus, Search, SearchX, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { MAX_SEED_CITIES, gradientFor } from '../../lib/constants.js';
import { useCityCatalog } from '../../hooks/useCityCatalog.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Alert, Badge, Button, EmptyState, Skeleton } from '../../components/ui/index.js';

/** Small selectable tile — the "places to visit" grid. */
const CityTile = ({ city, selected, disabled, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(city)}
    disabled={disabled && !selected}
    aria-pressed={selected}
    className={cn(
      'group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl text-left',
      'transition-transform duration-300 disabled:cursor-not-allowed disabled:opacity-40',
      selected
        ? 'ring-3 ring-brand-500 ring-offset-2 ring-offset-surface'
        : 'hover:-translate-y-1'
    )}
  >
    {city.imageUrl ? (
      <img
        src={city.imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    ) : (
      <div
        className={cn('absolute inset-0 bg-gradient-to-br', gradientFor(city.name + city.country))}
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent" />

    <span
      className={cn(
        'absolute top-2 right-2 grid size-7 place-items-center rounded-full transition-colors',
        selected
          ? 'bg-brand-500 text-white'
          : 'bg-white/25 text-white backdrop-blur-md group-hover:bg-white/40'
      )}
      aria-hidden
    >
      {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
    </span>

    <span className="absolute inset-x-0 bottom-0 block p-3">
      <span className="block truncate font-display text-[15px] leading-tight text-white uppercase">
        {city.name}
      </span>
      <span className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
        <MapPin className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{city.country}</span>
      </span>
    </span>
  </button>
);

/**
 * The catalog grid, split out so a failed fetch can be retried by remounting it.
 *
 * `useCityCatalog` has no refresh of its own and hooks are off-limits here, but
 * a fresh mount re-runs the request — so the parent bumps a key and the user
 * gets a real retry instead of a dead end.
 */
const CityCatalogGrid = ({ search, selectedIds, atLimit, onToggle, onRetry }) => {
  const debounced = useDebouncedValue(search, 350);
  const { cities, loading, error } = useCityCatalog({ search: debounced, limit: 12 });
  const searching = Boolean(debounced.trim());

  if (loading) {
    // Skeletons in the grid's own shape, so nothing shifts when the tiles land.
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        tone="error"
        title="The city catalog would not load"
        action={
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      >
        {error.message} You can still save the trip now and add every stop from the builder.
      </Alert>
    );
  }

  if (cities.length === 0) {
    return (
      <EmptyState
        compact
        icon={SearchX}
        title={searching ? 'Nothing matches that' : 'The catalog is empty'}
        description={
          searching
            ? 'Try the country instead, or a shorter spelling. You can also skip this and add stops later.'
            : 'Run `npm run seed` in the backend to load the starter cities. You can still save the trip and add stops by hand.'
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cities.map((city) => (
        <CityTile
          key={city._id}
          city={city}
          selected={selectedIds.has(city._id)}
          disabled={atLimit}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

/**
 * City picker for the Create Trip form.
 *
 * Selected cities are held as whole objects by the parent, not just ids, so the
 * chips keep their names after a search filters them out of the grid below.
 * The server turns this list into stops, in exactly this order.
 */
export const CitySuggestions = ({ selected, onToggle, onClear, search, onSearchChange, error }) => {
  const [attempt, setAttempt] = useState(0);

  const selectedIds = new Set(selected.map((city) => city._id));
  const atLimit = selected.length >= MAX_SEED_CITIES;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-500"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Try Lisbon, Japan, or somewhere you have never been"
          aria-label="Search the city catalog"
          className={cn(
            'h-12 w-full rounded-2xl border border-line-strong bg-surface pr-4 pl-11 text-[15px] text-ink-900',
            'transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-ink-300',
            'hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'
          )}
        />
      </div>

      {/* Chips: the itinerary order, and the only place a filtered-out pick
          can still be removed from. */}
      {selected.length > 0 ? (
        <div className="rounded-2xl border border-line bg-inset p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow text-ink-500">Your stops, in order</p>
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
            >
              Clear all
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selected.map((city, index) => (
              <span
                key={city._id}
                className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 py-1 pr-1 pl-3 text-xs font-medium text-brand-700"
              >
                <span className="font-display text-sm leading-none text-brand-500">{index + 1}</span>
                {city.name}
                <button
                  type="button"
                  onClick={() => onToggle(city)}
                  aria-label={`Remove ${city.name}`}
                  className="grid size-5 cursor-pointer place-items-center rounded-full text-brand-600 transition-colors hover:bg-brand-200"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-ink-500">
          Nothing picked yet — that is fine. Every stop can also be added from the builder once the
          trip exists.
        </p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-ember-700">
          {error}
        </p>
      )}

      <CityCatalogGrid
        key={attempt}
        search={search}
        selectedIds={selectedIds}
        atLimit={atLimit}
        onToggle={onToggle}
        onRetry={() => setAttempt((count) => count + 1)}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={atLimit ? 'ember' : 'neutral'}>
          {selected.length} of {MAX_SEED_CITIES} picked
        </Badge>
        {atLimit && (
          <p className="text-xs text-ink-500">
            That is the most you can add up front. Remove one, or add the rest from the builder.
          </p>
        )}
      </div>
    </div>
  );
};
