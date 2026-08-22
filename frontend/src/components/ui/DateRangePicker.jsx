import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import {
  formatDateRange,
  nightsBetween,
  todayInputValue,
  toUtcDate,
} from '../../lib/dates.js';

/**
 * A trip's date range, picked on a real calendar.
 *
 * Two native `<input type="date">` boxes side by side is what this replaces.
 * They are fine for a birthday and wrong for a trip: the user is choosing a
 * *span*, and a span is something you see — how many nights, whether it clears
 * a weekend, how far out it sits. So this draws two months at once and shades
 * the range as it is being formed.
 *
 * Everything is computed with the UTC helpers in lib/dates.js. Building a date
 * with `new Date(y, m, d)` here would land it in local time, and for anyone
 * west of Greenwich the trip would silently start a day early once it round
 * tripped through the API.
 *
 * Value in and out is 'YYYY-MM-DD', the same shape the API and a native date
 * input both use, so this drops into an existing form without a converter.
 */

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const iso = (date) => date.toISOString().slice(0, 10);

/** Monday-first grid, padded with nulls so every row holds seven cells. */
const monthMatrix = (year, month) => {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= length; day += 1) {
    cells.push(new Date(Date.UTC(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const Month = ({ year, month, startDate, endDate, hovered, min, max, onPick, onHover }) => {
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);

  // While only one end is chosen, the hovered day stands in for the other so
  // the range shades live under the cursor.
  const provisionalEnd = endDate || (startDate && hovered && hovered > startDate ? hovered : null);

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-3 text-center text-sm font-semibold text-ink-900">
        {MONTHS_LONG[month]} {year}
      </p>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-1 text-center text-[11px] font-semibold text-ink-300">
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`pad-${index}`} aria-hidden />;

          const value = iso(date);
          const disabled = (min && value < min) || (max && value > max);

          const isStart = value === startDate;
          const isEnd = value === endDate;
          const inRange =
            startDate && provisionalEnd && value > startDate && value < provisionalEnd;
          const isToday = value === todayInputValue();
          const edge = isStart || isEnd;

          return (
            <div
              key={value}
              className={cn(
                'relative py-0.5',
                // The connecting band is painted on the cell, not the button,
                // so the range reads as one continuous bar rather than a row
                // of separate chips.
                inRange && 'bg-brand-50',
                isStart && provisionalEnd && 'rounded-l-md bg-brand-50',
                isEnd && startDate && 'rounded-r-md bg-brand-50'
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(value)}
                onMouseEnter={() => onHover(value)}
                aria-label={`${date.getUTCDate()} ${MONTHS_LONG[month]} ${year}`}
                aria-pressed={edge}
                className={cn(
                  'relative mx-auto grid size-8 place-items-center rounded-md text-[12.5px] transition-colors',
                  disabled && 'cursor-not-allowed text-ink-300/60',
                  !disabled && !edge && 'text-ink-700 hover:bg-brand-100',
                  edge && 'bg-brand-500 font-semibold text-white',
                  isToday && !edge && 'font-semibold text-brand-600'
                )}
              >
                {date.getUTCDate()}
                {isToday && !edge && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-brand-500" aria-hidden />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DateRangePicker = ({
  startDate = '',
  endDate = '',
  onChange,
  min = todayInputValue(),
  max,
  label = 'Travel dates',
  hint,
  error,
  required = false,
  className,
  tone = 'light',
}) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const wrapper = useRef(null);
  const fieldId = useId();

  // The left-hand month. Opens on the trip's start if there is one.
  const [cursor, setCursor] = useState(() => {
    const anchor = toUtcDate(startDate) || new Date();
    return { year: anchor.getUTCFullYear(), month: anchor.getUTCMonth() };
  });

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    const onClick = (event) => {
      if (wrapper.current && !wrapper.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const step = (delta) =>
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  /**
   * One click sets the start and clears the end; the next completes the range.
   * Clicking earlier than the current start restarts from there rather than
   * producing a backwards range — the alternative is an error message for
   * something the user obviously meant.
   */
  const pick = (value) => {
    if (!startDate || endDate || value < startDate) {
      onChange({ startDate: value, endDate: '' });
      return;
    }
    onChange({ startDate, endDate: value });
    setOpen(false);
  };

  const clear = (event) => {
    event.stopPropagation();
    onChange({ startDate: '', endDate: '' });
  };

  const nights = startDate && endDate ? nightsBetween(startDate, endDate) : 0;
  const summary = formatDateRange(startDate, endDate);
  const dark = tone === 'dark';

  const next = new Date(Date.UTC(cursor.year, cursor.month + 1, 1));

  return (
    <div className={cn('relative', className)} ref={wrapper}>
      {label && (
        <label
          htmlFor={fieldId}
          className={cn(
            'mb-1.5 block text-[10.5px] font-semibold tracking-[0.1em] uppercase',
            dark ? 'text-white/70' : 'text-ink-500'
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-ember-500">*</span>}
        </label>
      )}

      <button
        id={fieldId}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors',
          dark
            ? 'border-white/20 bg-white/10 text-white hover:border-white/40'
            : 'border-line-strong bg-surface text-ink-900 hover:border-brand-300',
          error && !dark && 'border-ember-500'
        )}
      >
        <CalendarDays
          className={cn('size-4 shrink-0', dark ? 'text-white/70' : 'text-ink-500')}
          aria-hidden
        />

        <span className="min-w-0 flex-1 truncate font-medium">
          {summary || (
            <span className={dark ? 'text-white/55' : 'text-ink-300'}>Pick your dates</span>
          )}
        </span>

        {nights > 0 && (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold',
              dark ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-600'
            )}
          >
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        )}

        {(startDate || endDate) && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear dates"
            onClick={clear}
            className={cn(
              'grid size-5 shrink-0 place-items-center rounded transition-colors',
              dark ? 'text-white/60 hover:bg-white/15' : 'text-ink-300 hover:bg-canvas-deep'
            )}
          >
            <X className="size-3.5" aria-hidden />
          </span>
        )}
      </button>

      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-ember-500">{error}</p>}

      {open && (
        <div
          role="dialog"
          aria-label="Choose travel dates"
          // Always light, even in the hero's dark search bar — a calendar is a
          // dense reading surface and cream-on-glass is hard work.
          className="absolute z-50 mt-2 w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-3.5 shadow-lift"
          onMouseLeave={() => setHovered(null)}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="grid size-7 place-items-center rounded-md text-ink-700 transition-colors hover:bg-canvas-deep"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>

            <p className="text-xs font-medium text-ink-500">
              {startDate && !endDate ? 'Now pick the day you come back' : 'Pick your travel dates'}
            </p>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="grid size-7 place-items-center rounded-md text-ink-700 transition-colors hover:bg-canvas-deep"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row">
            <Month
              year={cursor.year}
              month={cursor.month}
              startDate={startDate}
              endDate={endDate}
              hovered={hovered}
              min={min}
              max={max}
              onPick={pick}
              onHover={setHovered}
            />
            <div className="hidden w-px shrink-0 bg-line sm:block" aria-hidden />
            <Month
              year={next.getUTCFullYear()}
              month={next.getUTCMonth()}
              startDate={startDate}
              endDate={endDate}
              hovered={hovered}
              min={min}
              max={max}
              onPick={pick}
              onHover={setHovered}
            />
          </div>

          <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
            <p className="text-xs text-ink-500">
              {summary ? (
                <>
                  <span className="font-semibold text-ink-900">{summary}</span>
                  {nights > 0 && ` · ${nights} ${nights === 1 ? 'night' : 'nights'}`}
                </>
              ) : (
                'No dates chosen yet'
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ startDate: '', endDate: '' })}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
