import { api } from './client.js';

/**
 * Published itineraries. No auth on any of these — the server exposes an
 * explicit field allowlist, so the owner's email and id never appear.
 */
export const publicApi = {
  /**
   * → { items, total, page, pages }
   *
   * Feed items carry NO `_id` — `publicSlug` is the only handle, so links are
   * built from the slug and the numeric trip id only arrives with `bySlug`.
   * Params: search, sort (recent | popular | name), page, limit.
   */
  list: (params = {}) => api.get('/public/trips', { params }).then((r) => r.data.data),

  /**
   * → { tripId, trip, owner, stopCount, activityCount, days, byCity, budget }
   *
   * `tripId` is here and nowhere else, and "Copy trip" needs it. The nested
   * `budget` is a trimmed subset — no limit, no per-day rows, no over-budget
   * flags, since those are the owner's business.
   *
   * Bumps the trip's view counter as a side effect.
   */
  bySlug: (slug) => api.get(`/public/trips/${slug}`).then((r) => r.data.data),
};
