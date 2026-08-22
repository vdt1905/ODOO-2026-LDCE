import { api } from './client.js';

/**
 * The public activity catalog. Read-only and unauthenticated — this is the
 * library you pick FROM; tripActivity.api.js is what you schedule INTO a trip.
 */
export const activityApi = {
  /**
   * → { items, total, page, pages, types }
   *
   * `types` ships on every list response, so the filter chips do not need a
   * separate /meta call — use `meta()` only for the cost and duration ceilings.
   *
   * Params: city, type, maxCost, maxDuration, search, sort, page, limit.
   * `sort` is one of rating | cost-asc | cost-desc | duration | name.
   */
  list: (params = {}) => api.get('/activities', { params }).then((r) => r.data.data),

  /** { types, maxCost, maxDuration, total } — the bounds for the range sliders. */
  meta: () => api.get('/activities/meta').then((r) => r.data.data),

  byId: (id) => api.get(`/activities/${id}`).then((r) => r.data.data.activity),
};
