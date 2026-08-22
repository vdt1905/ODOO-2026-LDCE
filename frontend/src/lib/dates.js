/**
 * Trip dates are calendar dates, not moments in time.
 *
 * The API stores and returns them at UTC midnight, so every read here is done
 * with the UTC getters. Formatting with local getters would show "13 Jul" to
 * anyone west of Greenwich for a trip that starts on the 14th.
 *
 * Mirrors backend/src/utils/dates.js — keep the two in step.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 'YYYY-MM-DD' | ISO string | Date → Date at UTC midnight, or null. */
export const toUtcDate = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/** Value for an `<input type="date">`. */
export const toDateInputValue = (value) => {
  const date = toUtcDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
};

/**
 * Today as the *browser* sees it — the right floor for a date picker, since
 * that is the calendar the user is looking at.
 */
export const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export const addDays = (value, days) => {
  const date = toUtcDate(value);
  return date ? new Date(date.getTime() + days * DAY_MS) : null;
};

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export const daysBetween = (from, to) => {
  const a = toUtcDate(from);
  const b = toUtcDate(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
};

/** Nights slept: 14th → 16th is 2 nights. */
export const nightsBetween = (start, end) => Math.max(0, daysBetween(start, end));

/** Days on the ground: 14th → 16th covers 3 days. */
export const daysInclusive = (start, end) => nightsBetween(start, end) + 1;

/** Days from today; negative once the date has passed. */
export const daysUntil = (value) => daysBetween(todayInputValue(), value);

/** 14 Jul 2026 · pass { long: true } for "14 July 2026". */
export const formatDate = (value, { long = false, withYear = true } = {}) => {
  const date = toUtcDate(value);
  if (!date) return '';

  const month = (long ? MONTHS_LONG : MONTHS)[date.getUTCMonth()];
  const day = date.getUTCDate();
  return withYear ? `${day} ${month} ${date.getUTCFullYear()}` : `${day} ${month}`;
};

/**
 * Collapses a range to the shortest unambiguous form:
 *   14 – 26 Jul 2026   ·   28 Jun – 3 Jul 2026   ·   28 Dec 2026 – 4 Jan 2027
 */
export const formatDateRange = (start, end) => {
  const from = toUtcDate(start);
  const to = toUtcDate(end);

  if (!from && !to) return '';
  if (!from) return formatDate(to);
  if (!to) return formatDate(from);

  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();

  if (sameMonth && from.getUTCDate() === to.getUTCDate()) return formatDate(from);
  if (sameMonth) return `${from.getUTCDate()} – ${formatDate(to)}`;
  if (sameYear) return `${formatDate(from, { withYear: false })} – ${formatDate(to)}`;
  return `${formatDate(from)} – ${formatDate(to)}`;
};

/** 'July 2026' — the heading a month-grouped trip list sits under. */
export const formatMonthYear = (value) => {
  const date = toUtcDate(value);
  return date ? `${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}` : 'No date';
};

/** Sortable '2026-07' key for month grouping. */
export const monthKey = (value) => {
  const date = toUtcDate(value);
  if (!date) return '9999-99';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

/** "in 12 days" / "today" / "3 days ago" — for the countdown badge. */
export const relativeDayLabel = (value) => {
  const days = daysUntil(value);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
};
