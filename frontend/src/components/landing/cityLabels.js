/**
 * Plain-English readings of the 1–100 city indices.
 *
 * Their own module rather than named exports from CityCard.jsx: a file that
 * exports both components and plain functions loses React Fast Refresh, so
 * every edit to the card would full-reload the page instead of hot-swapping it.
 *
 * Both strings stay short on purpose — the caption sits under a metric column
 * that is only ~55px wide in the dashboard's two-up mobile grid, and a
 * truncated "Budget frie…" is worse than no caption at all.
 */
export const costLabel = (index) => {
  if (index <= 35) return 'Affordable';
  if (index <= 60) return 'Mid range';
  if (index <= 80) return 'Pricey';
  return 'Expensive';
};

export const popularityLabel = (index) => {
  if (index <= 40) return 'Quiet';
  if (index <= 65) return 'Steady';
  if (index <= 85) return 'Popular';
  return 'Top pick';
};
