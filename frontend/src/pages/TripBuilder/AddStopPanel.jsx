import { useState } from 'react';
import { Check, MapPin, Plus, SearchX, WifiOff, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { addDays, toDateInputValue } from '../../lib/dates.js';
import { useCityCatalog } from '../../hooks/useCityCatalog.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Button, DateRangePicker, EmptyState, Input } from '../../components/ui/index.js';

/**
 * A sensible opening range for the next stop: pick up where the last one left
 * off, stay two nights, and never propose a departure past the end of the trip.
 * A default that trips a warning the second it appears is not a default.
 *
 * Arriving on the day the previous stop ends is a travel day, not an overlap —
 * the server only warns when the two ranges actually cross.
 */
const suggestRange = (trip, stops) => {
  const tripEnd = toDateInputValue(trip.endDate);
  const last = stops[stops.length - 1];

  const startDate = toDateInputValue(last ? last.endDate : trip.startDate);
  const twoNights = toDateInputValue(addDays(startDate, 2));
  const endDate = twoNights > tripEnd && tripEnd > startDate ? tripEnd : twoNights;

  return { startDate, endDate };
};

const CitySkeleton = () => <div className="h-16 animate-pulse rounded-2xl bg-canvas-deep" />;

/** Mounted only while the panel is open, so opening it is always a clean slate. */
const StopForm = ({ trip, stops, onAdd, onCancel }) => {
  const [city, setCity] = useState(null);
  const [range, setRange] = useState(() => suggestRange(trip, stops));
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const debounced = useDebouncedValue(search, 350);
  const { cities, loading, error } = useCityCatalog({ search: debounced, limit: 12 });

  const submit = async (event) => {
    event.preventDefault();
    if (!city) return;

    setSubmitting(true);
    // `order` is left out so the stop is appended to the end of the trip.
    const created = await onAdd({
      cityId: city._id,
      startDate: range.startDate,
      endDate: range.endDate,
    });
    setSubmitting(false);
    if (created) onCancel();
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-line bg-surface p-5"
      aria-label="Add a city to this trip"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink-900">Add a city</h2>
          <p className="mt-1 text-sm text-ink-500">
            Pick where you are going, then say when you are there.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel adding a city"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <Input
        type="search"
        label="Search the city catalog"
        placeholder="Lisbon, Japan, Cape Town"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        wrapperClassName="mt-4"
      />

      {error && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <WifiOff className="size-3.5" aria-hidden />
          Cities could not be loaded — {error.message}
        </p>
      )}

      {!loading && !error && cities.length === 0 && (
        <EmptyState
          compact
          className="mt-4"
          icon={SearchX}
          title={debounced.trim() ? 'No cities match that' : 'The catalog is empty'}
          description={
            debounced.trim()
              ? 'Try a country name, or a shorter spelling.'
              : 'Run `npm run seed` in the backend to load the starter cities.'
          }
        />
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, index) => <CitySkeleton key={index} />)
          : cities.map((option) => {
              const selected = city?._id === option._id;
              return (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => setCity(option)}
                  aria-pressed={selected}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-line hover:border-brand-300 hover:bg-canvas-deep'
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {option.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{option.country}</span>
                    </span>
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-brand-600" aria-hidden />}
                </button>
              );
            })}
      </div>

      <div className="mt-5">
        {/* One calendar for the whole stay. `min` is left open because a stop
            outside the trip's own dates is a warning the server returns, not
            something the picker should silently prevent. */}
        <DateRangePicker
          label="Arrival — departure"
          required
          min={undefined}
          startDate={range.startDate}
          endDate={range.endDate}
          onChange={setRange}
        />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={submitting}
          disabled={!city || !range.startDate || !range.endDate}
          leftIcon={<Plus className="size-4" />}
        >
          {city ? `Add ${city.name}` : 'Add stop'}
        </Button>
      </div>
    </form>
  );
};

export const AddStopPanel = ({ trip, stops, open, onOpen, onClose, onAdd }) => {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-line-dashed bg-surface/50 px-5 py-6 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-surface hover:text-brand-600"
      >
        <Plus className="size-4" aria-hidden />
        Add another city
      </button>
    );
  }

  return <StopForm trip={trip} stops={stops} onAdd={onAdd} onCancel={onClose} />;
};
