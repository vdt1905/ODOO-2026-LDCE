import { useMemo, useState } from 'react';
import {
  BedDouble,
  Bus,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  MapPin,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';

import { daysBetween, formatDate, formatDateRange, toDateInputValue } from '../../lib/dates.js';
import { formatCurrency, pluralise } from '../../lib/format.js';
import { Badge, Button, DateRangePicker, Input, TextArea } from '../../components/ui/index.js';
import { ActivityRow, buildDayOptions } from './ActivityRow.jsx';
import { stopCost } from './costs.js';
import { useDebouncedPatch } from './useDebouncedPatch.js';

/** An untouched cost shows its placeholder rather than a literal "0". */
const moneyDraft = (value) => (Number(value) ? String(value) : '');

const clampCost = (value) => Math.max(0, Number(value) || 0);

/** Activities arrive sorted by date then order, so one pass keeps them in order. */
const groupByDay = (activities = []) => {
  const groups = new Map();
  for (const entry of activities) {
    const key = toDateInputValue(entry.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, items }));
};

export const StopCard = ({
  trip,
  stop,
  index,
  stopCount,
  warnings,
  activityNotices,
  onDraft,
  onSave,
  onMove,
  onDelete,
  onAddActivity,
  onActivityDraft,
  onActivitySave,
  onActivityMove,
  onActivityDelete,
}) => {
  const [draft, setDraft] = useState(() => ({
    startDate: toDateInputValue(stop.startDate),
    endDate: toDateInputValue(stop.endDate),
    notes: stop.notes || '',
    transportCost: moneyDraft(stop.transportCost),
    accommodationCost: moneyDraft(stop.accommodationCost),
    mealBudgetPerDay: moneyDraft(stop.mealBudgetPerDay),
  }));

  const { queue, flush } = useDebouncedPatch((patch) => onSave(stop._id, patch));

  /**
   * Three things happen per keystroke: the box updates, the running total
   * updates, and one request is queued. Only the changed key is ever sent —
   * the update schema is strict, so an extra key would be a 422 rather than
   * an ignored field.
   */
  const setField = (key, raw, parsed = raw) => {
    setDraft((current) => ({ ...current, [key]: raw }));
    onDraft(stop._id, { [key]: parsed });
    queue({ [key]: parsed });
  };

  const setDate = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    // A cleared date box is not a date the server can parse; wait for a real one.
    if (!value) return;
    onDraft(stop._id, { [key]: value });
    queue({ [key]: value });
  };

  /** The picker hands back both ends at once; each is queued on its own key. */
  const setRange = ({ startDate, endDate }) => {
    if (startDate !== draft.startDate) setDate('startDate', startDate);
    if (endDate !== draft.endDate) setDate('endDate', endDate);
  };

  const cost = stopCost(stop);
  const dayGroups = useMemo(() => groupByDay(stop.activities), [stop.activities]);
  const dayOptions = useMemo(
    () => buildDayOptions(stop.startDate, cost.nights),
    [stop.startDate, cost.nights]
  );

  const city = stop.city || {};

  return (
    <article className="rounded-3xl border border-line bg-surface">
      <header className="flex flex-wrap items-start gap-4 p-5 sm:flex-nowrap">
        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => onMove(stop._id, -1)}
            disabled={index === 0}
            aria-label={`Move ${city.name || 'this stop'} earlier in the trip`}
            className="grid size-7 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <span className="grid size-8 place-items-center rounded-full bg-brand-50 font-display text-sm text-brand-600">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={() => onMove(stop._id, 1)}
            disabled={index === stopCount - 1}
            aria-label={`Move ${city.name || 'this stop'} later in the trip`}
            className="grid size-7 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl text-ink-900">
            {city.name || 'Unknown city'}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {city.country || '—'}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDateRange(stop.startDate, stop.endDate)}
            </span>
            <Badge tone="neutral">{pluralise(cost.nights, 'night')}</Badge>
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-right">
            <p className="font-display text-xl text-ink-900">
              {formatCurrency(cost.total, trip.currency)}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {pluralise(stop.activities?.length || 0, 'activity', 'activities')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(stop)}
            aria-label={`Remove ${city.name || 'this stop'} from the trip`}
            className="grid size-9 place-items-center rounded-full text-ink-300 transition-colors hover:bg-ember-50 hover:text-ember-700"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      {warnings?.length > 0 && (
        <div className="mx-5 mb-5 flex items-start gap-2 rounded-2xl bg-ember-50 px-4 py-3 text-sm text-ember-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Saved, but worth a look</p>
            <ul className="mt-0.5 space-y-0.5 text-xs">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border-t border-line px-5 py-5">
        {/* One calendar for the stay rather than two date boxes. `min` is left
            open: a stop that sits outside the trip's own dates is a warning the
            server hands back, not something to silently prevent here. */}
        <DateRangePicker
          label="Arrival — departure"
          min={undefined}
          startDate={draft.startDate}
          endDate={draft.endDate}
          onChange={setRange}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input
            label={`Transport (${trip.currency})`}
            type="number"
            inputMode="decimal"
            min="0"
            step="10"
            placeholder="0"
            icon={Bus}
            value={draft.transportCost}
            onChange={(event) =>
              setField('transportCost', event.target.value, clampCost(event.target.value))
            }
            onBlur={flush}
          />
          <Input
            label={`Accommodation (${trip.currency})`}
            type="number"
            inputMode="decimal"
            min="0"
            step="10"
            placeholder="0"
            icon={BedDouble}
            value={draft.accommodationCost}
            onChange={(event) =>
              setField('accommodationCost', event.target.value, clampCost(event.target.value))
            }
            onBlur={flush}
          />
          {/* The field is `mealBudgetPerDay`, but the budget multiplies it by
              NIGHTS — so the label says nights, to match what the total does. */}
          <Input
            label={`Meals per night (${trip.currency})`}
            type="number"
            inputMode="decimal"
            min="0"
            step="5"
            placeholder="0"
            icon={Utensils}
            hint={`× ${pluralise(cost.nights, 'night')} = ${formatCurrency(cost.meals, trip.currency)}`}
            value={draft.mealBudgetPerDay}
            onChange={(event) =>
              setField('mealBudgetPerDay', event.target.value, clampCost(event.target.value))
            }
            onBlur={flush}
          />
        </div>

        <TextArea
          label="Notes"
          rows={2}
          placeholder="Where you are staying, who to meet, what to book before you go."
          value={draft.notes}
          onChange={(event) => setField('notes', event.target.value)}
          onBlur={flush}
          wrapperClassName="mt-4"
        />

        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          <span>Transport {formatCurrency(cost.transport, trip.currency)}</span>
          <span>Stay {formatCurrency(cost.stay, trip.currency)}</span>
          <span>Meals {formatCurrency(cost.meals, trip.currency)}</span>
          <span>Activities {formatCurrency(cost.activities, trip.currency)}</span>
        </p>
      </div>

      <div className="border-t border-line bg-inset px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl text-ink-900">Things to do</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAddActivity(stop)}
            leftIcon={<Plus className="size-4" />}
          >
            Add activity
          </Button>
        </div>

        {dayGroups.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-ink-500">
            Nothing planned in {city.name || 'this city'} yet.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {dayGroups.map(({ key, items }) => {
              const dayNumber = daysBetween(stop.startDate, key) + 1;
              const inRange = dayNumber >= 1 && dayNumber <= cost.nights + 1;
              const dayIds = items.map((entry) => String(entry._id));

              return (
                <section key={key}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h4 className="text-sm font-semibold text-ink-900">
                      {inRange ? `Day ${dayNumber}` : 'Outside the stay'}
                    </h4>
                    <span className="text-xs text-ink-500">
                      {formatDate(key, { withYear: false })}
                    </span>
                    <span className="text-xs text-ink-300">
                      {formatCurrency(
                        items.reduce((sum, entry) => sum + (Number(entry.cost) || 0), 0),
                        trip.currency
                      )}
                    </span>
                  </div>

                  {/* ActivityRow is the <li> — it owns its own row chrome. */}
                  <ul className="mt-2 space-y-2">
                    {items.map((entry, position) => (
                      <ActivityRow
                        key={entry._id}
                        trip={trip}
                        activity={entry}
                        dayOptions={dayOptions}
                        notice={activityNotices?.[entry._id]}
                        first={position === 0}
                        last={position === items.length - 1}
                        onDraft={onActivityDraft}
                        onSave={onActivitySave}
                        onMove={(activityId, direction) =>
                          onActivityMove(dayIds, activityId, direction)
                        }
                        onDelete={onActivityDelete}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};

export const StopCardSkeleton = () => (
  <div className="rounded-3xl border border-line bg-surface p-5">
    <div className="h-6 w-40 animate-pulse rounded-full bg-canvas-deep" />
    <div className="mt-3 h-3 w-64 animate-pulse rounded-full bg-canvas-deep" />
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <div className="h-12 animate-pulse rounded-2xl bg-canvas-deep" />
      <div className="h-12 animate-pulse rounded-2xl bg-canvas-deep" />
      <div className="h-12 animate-pulse rounded-2xl bg-canvas-deep" />
    </div>
    <div className="mt-4 h-20 animate-pulse rounded-2xl bg-canvas-deep" />
  </div>
);
