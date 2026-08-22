export const money = (value, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const date = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : 'Not set';

export const dateInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 10);
};

export const dateRange = (start, end) => `${date(start)} - ${date(end)}`;

// Nouns with an irregular plural used elsewhere in the app. Extend this map
// rather than reaching for a pluralization library over two words.
const IRREGULAR_PLURALS = {
  city: 'cities',
  activity: 'activities',
  country: 'countries',
};

export const plural = (count, noun) => {
  const n = Number(count) || 0;
  if (n === 1) return `${n} ${noun}`;
  return `${n} ${IRREGULAR_PLURALS[noun] || `${noun}s`}`;
};
