/** Money and number formatting. One place, so every screen agrees. */

/**
 * `Intl` throws on an unrecognised currency code, and a bad code in one trip
 * document must not blank out a whole dashboard — fall back to "EUR 1,240".
 */
export const formatCurrency = (amount, currency = 'USD', { compact = false } = {}) => {
  const value = Number(amount) || 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
      // minimumFractionDigits is explicit: compact notation otherwise pins the
      // minimum to the maximum and renders "$124.0K" instead of "$124K".
      ...(compact && Math.abs(value) >= 10_000
        ? { notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }
        : {}),
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString('en-US')}`;
  }
};

export const formatNumber = (value) => (Number(value) || 0).toLocaleString('en-US');

/** Minutes as "45m" / "3h" / "2h 30m" — the catalog stores raw minutes. */
export const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

/** "3 cities" / "1 city" — pluralisation without pulling in a library. */
export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

/** "Paris, Rome & Lisbon", truncated once the list stops being readable. */
export const listNames = (names = [], max = 3) => {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;

  if (shown.length === 0) return '';
  if (shown.length === 1) return shown[0];

  const head = shown.slice(0, -1).join(', ');
  const tail = shown[shown.length - 1];
  const base = `${head} & ${tail}`;

  return rest > 0 ? `${base} +${rest} more` : base;
};
