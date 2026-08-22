import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, SearchX, Star, X } from 'lucide-react';

import { activityApi } from '../../api/activity.api.js';
import { stopApi } from '../../api/stop.api.js';
import { cn } from '../../lib/cn.js';
import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { Alert, Button, EmptyState, Input, Select } from '../../components/ui/index.js';
import { buildDayOptions } from './ActivityRow.jsx';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

const TABS = [
  { value: 'catalog', label: 'From the catalog' },
  { value: 'custom', label: 'Something else' },
];

const RowSkeleton = () => <div className="h-20 animate-pulse rounded-2xl bg-canvas-deep" />;

/**
 * The activity drawer for one stop.
 *
 * Mounted only while open, so every piece of its state — tab, search, day,
 * custom form — resets with it and there is nothing to clear on close.
 *
 * Days come from `GET /stops/:id/days` rather than the stop already in memory:
 * a date edit on the card may still be sitting in its debounce window, and the
 * picker must offer the days the server will actually accept.
 */
export const ActivityPicker = ({ trip, stop, onAdd, onClose }) => {
  const ref = useRef(null);

  const [tab, setTab] = useState('catalog');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [added, setAdded] = useState([]);
  const [custom, setCustom] = useState({ name: '', cost: '', duration: '60', startTime: '' });

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data: days, error: daysError } = useAsync(
    () => stopApi.days(trip._id, stop._id),
    [trip._id, stop._id]
  );

  const { data: catalog, loading: catalogLoading, error: catalogError } = useAsync(
    () =>
      activityApi.list({
        city: stop.city?._id,
        search: debouncedSearch.trim(),
        limit: 24,
        sort: 'rating',
      }),
    [stop.city?._id, debouncedSearch.trim()]
  );

  const dayChoices = useMemo(
    () => (days ? buildDayOptions(days.startDate, days.nights) : []),
    [days]
  );

  // The first available day is the default without requiring an effect-driven
  // state update. Once the traveller picks a day, their explicit choice wins.
  const selectedDate = date || dayChoices[0]?.value || '';

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    // `onClose` changing would re-run this; showModal() on an already-open
    // dialog throws, so open it only when it is not already open.
    if (!dialog.open) dialog.showModal();

    const handleCancel = (event) => {
      event.preventDefault();
      onClose();
    };
    dialog?.addEventListener('cancel', handleCancel);
    return () => dialog?.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const addFromCatalog = async (entry) => {
    setBusyId(entry._id);
    // No cost, no durationMinutes: left out, the server copies them from the
    // catalog row. Sending cost: 0 would pin the activity to free.
    const created = await onAdd({
      stopId: stop._id,
      activityId: entry._id,
      date: selectedDate,
    });
    setBusyId(null);
    if (created) setAdded((current) => [...current, entry._id]);
  };

  const addCustom = async (event) => {
    event.preventDefault();
    setBusyId('custom');
    // Nothing to inherit from, so cost and duration are always explicit here.
    const created = await onAdd({
      stopId: stop._id,
      customName: custom.name.trim(),
      date: selectedDate,
      startTime: custom.startTime,
      cost: Math.max(0, Number(custom.cost) || 0),
      durationMinutes: Math.min(1440, Math.max(0, Math.round(Number(custom.duration) || 60))),
    });
    setBusyId(null);
    if (created) setCustom({ name: '', cost: '', duration: '60', startTime: '' });
  };

  const items = catalog?.items || [];

  return (
    <dialog
      ref={ref}
      aria-label={`Add an activity in ${stop.city?.name || 'this city'}`}
      className="m-auto flex max-h-[85vh] w-[min(44rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface p-0 text-ink-900 backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <header className="border-b border-line p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow text-ink-500">Add to the plan</p>
            <h2 className="mt-1 font-display text-xl text-ink-900">
              {stop.city?.name || 'This stop'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
          <div className="flex gap-1 rounded-full border border-line bg-inset p-1">
            {TABS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTab(option.value)}
                aria-pressed={tab === option.value}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  tab === option.value
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-500 hover:text-ink-900'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Select
            aria-label="Day"
            size="sm"
            value={selectedDate}
            onChange={(event) => setDate(event.target.value)}
            options={dayChoices}
            placeholder={dayChoices.length === 0 ? 'Loading days' : undefined}
          />
        </div>

        {daysError && (
          <Alert tone="error" className="mt-3">
            The days for this stop could not be loaded — {daysError.message}
          </Alert>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {tab === 'catalog' ? (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search things to do in ${stop.city?.name || 'this city'}`}
                aria-label="Search the activity catalog"
                className="h-11 w-full rounded-full border border-line bg-canvas pr-4 pl-11 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/12"
              />
            </div>

            {catalogError && (
              <Alert tone="error" className="mt-4">
                {catalogError.message}
              </Alert>
            )}

            <div className="mt-4 space-y-2">
              {catalogLoading &&
                Array.from({ length: 4 }, (_, index) => <RowSkeleton key={index} />)}

              {!catalogLoading &&
                !catalogError &&
                items.length === 0 &&
                (debouncedSearch.trim() ? (
                  <EmptyState
                    compact
                    icon={SearchX}
                    title="Nothing matches that"
                    description="Try a shorter word, or add it as a custom activity instead."
                  />
                ) : (
                  <EmptyState
                    compact
                    icon={SearchX}
                    title="No catalog activities here yet"
                    description="Run `npm run seed` in the backend, or add your own with the other tab."
                  />
                ))}

              {!catalogLoading &&
                items.map((entry) => {
                  const meta = ACTIVITY_TYPE_META[entry.type] || ACTIVITY_TYPE_META.custom;
                  return (
                    <div
                      key={entry._id}
                      className="flex items-start gap-3 rounded-2xl border border-line p-3"
                    >
                      <ActivityIcon type={entry.type} className="mt-0.5 size-4 text-ink-500" />

                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
                          <span className="truncate">{entry.name}</span>
                          {added.includes(entry._id) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-600">
                              <Check className="size-3" aria-hidden />
                              Added
                            </span>
                          )}
                        </p>
                        {entry.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                            {entry.description}
                          </p>
                        )}
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                          <span className="font-medium text-ink-700">
                            {formatCurrency(entry.cost, trip.currency)}
                          </span>
                          <span>{formatDuration(entry.durationMinutes)}</span>
                          <span className="flex items-center gap-1">
                            <Star className="size-3" aria-hidden />
                            {entry.rating?.toFixed(1)}
                          </span>
                          <span className="text-ink-300">{meta.label}</span>
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={busyId === entry._id}
                        disabled={!selectedDate}
                        onClick={() => addFromCatalog(entry)}
                        leftIcon={<Plus className="size-3.5" />}
                        aria-label={`Add ${entry.name}`}
                      >
                        Add
                      </Button>
                    </div>
                  );
                })}
            </div>

            {catalog?.total > items.length && (
              <p className="mt-4 text-center text-xs text-ink-500">
                Showing {items.length} of {catalog.total} — search to narrow it down.
              </p>
            )}
          </>
        ) : (
          <form onSubmit={addCustom} className="space-y-4">
            <Input
              label="What is it?"
              placeholder="Dinner with Ana, ferry to the island, laundry"
              required
              value={custom.name}
              onChange={(event) => setCustom((c) => ({ ...c, name: event.target.value }))}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Start time"
                type="time"
                hint="Optional"
                value={custom.startTime}
                onChange={(event) => setCustom((c) => ({ ...c, startTime: event.target.value }))}
              />
              <Input
                label="Duration (min)"
                type="number"
                inputMode="numeric"
                min="0"
                max="1440"
                step="15"
                value={custom.duration}
                onChange={(event) => setCustom((c) => ({ ...c, duration: event.target.value }))}
              />
              <Input
                label={`Cost (${trip.currency})`}
                type="number"
                inputMode="decimal"
                min="0"
                step="5"
                placeholder="0"
                value={custom.cost}
                onChange={(event) => setCustom((c) => ({ ...c, cost: event.target.value }))}
              />
            </div>

            <p className="text-xs leading-relaxed text-ink-500">
              There is no catalog entry behind a custom activity, so its cost and duration are
              whatever you put here.
            </p>

            <Button
              type="submit"
              loading={busyId === 'custom'}
              disabled={!custom.name.trim() || !selectedDate}
              leftIcon={<Plus className="size-4" />}
            >
              Add to day
            </Button>
          </form>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-line bg-inset px-5 py-3">
        <p className="text-xs text-ink-500">
          {added.length > 0
            ? `${added.length} added — they are on the card behind this.`
            : 'Add as many as you like; the card updates as you go.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Done
        </Button>
      </footer>
    </dialog>
  );
};
