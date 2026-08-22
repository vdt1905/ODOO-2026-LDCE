import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, CircleAlert, Clock, Pencil, Trash2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { addDays, formatDate, toDateInputValue } from '../../lib/dates.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { Input, Select } from '../../components/ui/index.js';
import { useDebouncedPatch } from './useDebouncedPatch.js';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

const clampMinutes = (value) => Math.min(1440, Math.max(0, Math.round(Number(value) || 0)));
const clampCost = (value) => Math.max(0, Number(value) || 0);

// Shared with the picker/card module; keeping it here avoids date-label drift.
// eslint-disable-next-line react-refresh/only-export-components
export const activityName = (entry) =>
  entry.activity?.name || entry.customName || 'Untitled activity';

/**
 * The days an activity on this stop may sit on. `nights + 1` is the inclusive
 * day count — a stop with two nights covers three days.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const buildDayOptions = (startDate, nights) =>
  Array.from({ length: Math.max(1, (Number(nights) || 0) + 1) }, (_, index) => {
    const value = toDateInputValue(addDays(startDate, index));
    return { value, label: `Day ${index + 1} · ${formatDate(value, { withYear: false })}` };
  });

/**
 * One scheduled activity inside a stop's day.
 *
 * Collapsed by default: a stop with eight things booked would otherwise be
 * forty inputs stacked on one card. The edit panel writes through the same
 * draft-then-debounce path as the stop fields above it.
 */
export const ActivityRow = ({
  trip,
  activity,
  dayOptions,
  notice,
  first,
  last,
  onDraft,
  onSave,
  onMove,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    date: toDateInputValue(activity.date),
    startTime: activity.startTime || '',
    durationMinutes: String(activity.durationMinutes ?? 60),
    cost: String(activity.cost ?? 0),
    notes: activity.notes || '',
    customName: activity.customName || '',
  }));

  const { queue, flush } = useDebouncedPatch((patch) => onSave(activity._id, patch));

  // Draft feeds the input, the parsed value feeds the running total right away,
  // and the request goes out once typing stops.
  const setField = (key, raw, parsed = raw) => {
    setDraft((current) => ({ ...current, [key]: raw }));
    onDraft(activity._id, { [key]: parsed });
    queue({ [key]: parsed });
  };

  const meta = ACTIVITY_TYPE_META[activity.activity?.type || 'custom'] || ACTIVITY_TYPE_META.custom;
  const isCustom = !activity.activity;
  const name = activityName(activity);

  // A date the server has flagged as outside the stay is still a real date.
  // Without this the <select> would fall back to day one and quietly misreport
  // where the activity actually sits.
  const days = useMemo(
    () =>
      dayOptions.some((option) => option.value === draft.date)
        ? dayOptions
        : [
            ...dayOptions,
            { value: draft.date, label: `${formatDate(draft.date, { withYear: false })} · outside the stay` },
          ],
    [dayOptions, draft.date]
  );

  return (
    <li className="rounded-2xl border border-line bg-surface">
      <div className="flex items-start gap-3 p-3">
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(activity._id, -1)}
            disabled={first}
            aria-label={`Move ${name} earlier in the day`}
            className="grid size-6 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onMove(activity._id, 1)}
            disabled={last}
            aria-label={`Move ${name} later in the day`}
            className="grid size-6 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="size-4" aria-hidden />
          </button>
        </div>

        <ActivityIcon type={activity.type} className="mt-0.5 size-4 text-ink-500" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900">{name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {activity.startTime || 'Any time'} · {formatDuration(activity.durationMinutes)}
            </span>
            <span className="font-medium text-ink-700">
              {formatCurrency(activity.cost, trip.currency)}
            </span>
            <span className="text-ink-300">{meta.label}</span>
          </p>
          {activity.notes && !open && (
            <p className="mt-1 line-clamp-1 text-xs text-ink-500">{activity.notes}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              // Collapsing while a field is still counting down would leave the
              // edit unsent until the next one, so drain the queue on the way out.
              if (open) flush();
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            aria-label={open ? `Close editor for ${name}` : `Edit ${name}`}
            className={cn(
              'grid size-8 place-items-center rounded-full transition-colors',
              open
                ? 'bg-brand-50 text-brand-600'
                : 'text-ink-300 hover:bg-canvas-deep hover:text-ink-900'
            )}
          >
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(activity)}
            aria-label={`Remove ${name}`}
            className="grid size-8 place-items-center rounded-full text-ink-300 transition-colors hover:bg-ember-50 hover:text-ember-700"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {notice?.length > 0 && (
        <p className="mx-3 mb-3 flex items-start gap-2 rounded-xl bg-ember-50 px-3 py-2 text-xs text-ember-700">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{notice.join(' · ')}</span>
        </p>
      )}

      {open && (
        <div className="border-t border-line p-3">
          {isCustom && (
            <Input
              label="Name"
              value={draft.customName}
              onChange={(event) => setField('customName', event.target.value)}
              onBlur={flush}
              wrapperClassName="mb-3"
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Day"
              value={draft.date}
              onChange={(event) => setField('date', event.target.value)}
              options={days}
            />
            <Input
              label="Start time"
              type="time"
              value={draft.startTime}
              // '' is a valid startTime and means "any time" — an empty time
              // input already gives exactly that, so it is sent as-is.
              onChange={(event) => setField('startTime', event.target.value)}
              onBlur={flush}
            />
            <Input
              label="Duration (min)"
              type="number"
              inputMode="numeric"
              min="0"
              max="1440"
              step="15"
              value={draft.durationMinutes}
              onChange={(event) =>
                setField('durationMinutes', event.target.value, clampMinutes(event.target.value))
              }
              onBlur={flush}
            />
            <Input
              label={`Cost (${trip.currency})`}
              type="number"
              inputMode="decimal"
              min="0"
              step="5"
              value={draft.cost}
              onChange={(event) => setField('cost', event.target.value, clampCost(event.target.value))}
              onBlur={flush}
            />
          </div>

          <Input
            label="Notes"
            placeholder="Booking reference, who is coming, what to bring"
            value={draft.notes}
            onChange={(event) => setField('notes', event.target.value)}
            onBlur={flush}
            wrapperClassName="mt-3"
          />
        </div>
      )}
    </li>
  );
};
