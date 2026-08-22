/**
 * Makes a user-typed search string safe to drop into a `$regex` filter.
 * Without this, typing `(` in a search box throws inside Mongo and surfaces as
 * a 500 instead of "no results".
 */
export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
