/**
 * Day arithmetic in UTC.
 *
 * Every trip/stop/activity date is a calendar day, not a moment. Normalising to
 * UTC midnight means a server in IST and a browser in UTC agree on which day a
 * date is — the classic source of "my activity moved a day" bugs.
 *
 * Deliberately dependency-free: the backend adds no packages for this.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Strips the time component, keeping the calendar day the date represents. */
export const startOfUTCDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const addDays = (value, days) => {
  const date = startOfUTCDay(value);
  if (!date) return null;
  return new Date(date.getTime() + days * MS_PER_DAY);
};

/** Whole days between two dates — the number of nights for a stop. */
export const differenceInDays = (later, earlier) => {
  const a = startOfUTCDay(later);
  const b = startOfUTCDay(earlier);
  if (!a || !b) return 0;
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
};

/** 'YYYY-MM-DD' — the key used for daily-spend maps and calendar cells. */
export const toDateKey = (value) => {
  const date = startOfUTCDay(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

/** Inclusive list of every calendar day from `start` to `end`. */
export const eachDayBetween = (start, end) => {
  const first = startOfUTCDay(start);
  const last = startOfUTCDay(end);
  if (!first || !last || last < first) return [];

  const days = [];
  for (let d = first; d <= last; d = new Date(d.getTime() + MS_PER_DAY)) {
    days.push(new Date(d));
  }
  return days;
};

export const isSameDay = (a, b) => toDateKey(a) === toDateKey(b);
