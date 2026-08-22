/**
 * Trip dates are calendar dates, not moments in time — "14 July" means the
 * same thing to a traveller in Ahmedabad and one in Lisbon.
 *
 * Everything here therefore normalises to **UTC midnight**, so a date never
 * drifts a day when it crosses a timezone on its way to the browser.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Any Date → the same calendar day at 00:00 UTC. */
export const startOfUtcDay = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

/**
 * Parses a calendar date from the wire. Accepts `'2026-07-14'` (what an
 * `<input type="date">` sends) and full ISO strings, and rejects impossible
 * dates like `2026-02-31` that `new Date()` would silently roll over.
 */
export const parseDateOnly = (value) => {
  if (value instanceof Date) return startOfUtcDay(value);
  if (typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Rolled over (e.g. 31 Feb → 3 Mar) means the input was not a real date.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) return null;
  if (date.getUTCDate() !== day) return null;

  return date;
};

/** Today at 00:00 UTC — the reference point for trip status. */
export const todayUtc = () => startOfUtcDay(new Date());

export const addUtcDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export const diffInDays = (from, to) => {
  const a = startOfUtcDay(from);
  const b = startOfUtcDay(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
};

/** Nights slept: a 14th→16th stay is 2 nights. */
export const nightsBetween = (start, end) => Math.max(0, diffInDays(start, end));

/** Days on the ground: a 14th→16th stay covers 3 days. */
export const daysInclusive = (start, end) => nightsBetween(start, end) + 1;

/** Date → 'YYYY-MM-DD'. */
export const toDateOnlyString = (value) => {
  const date = startOfUtcDay(value);
  return date ? date.toISOString().slice(0, 10) : '';
};
