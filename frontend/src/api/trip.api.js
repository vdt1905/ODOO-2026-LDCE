import { api } from './client.js';

/**
 * Every function returns the unwrapped `data` payload from the API envelope.
 * Params are passed through verbatim — the names here are the names the server
 * validates in trip.validator.js.
 */
export const tripApi = {
  /** { items, total, page, pages } */
  list: (params = {}) => api.get('/trips', { params }).then((r) => r.data.data),

  /** Totals across every trip, for the dashboard's budget strip. */
  stats: () => api.get('/trips/stats').then((r) => r.data.data.stats),

  /**
   * The full trip, with `trip.stops` already populated and each stop carrying
   * its own `activities` array. The builder should use this single call rather
   * than stopApi.list + tripActivityApi.list.
   */
  byId: (id) => api.get(`/trips/${id}`).then((r) => r.data.data.trip),

  /** `cityIds` become stops in the same request, in the order they were picked. */
  create: (payload) => api.post('/trips', payload).then((r) => r.data.data.trip),

  update: (id, payload) => api.patch(`/trips/${id}`, payload).then((r) => r.data.data.trip),

  /** → { stopCount, activityCount } deleted alongside the trip. */
  remove: (id) => api.delete(`/trips/${id}`).then((r) => r.data.data),

  /** Full breakdown: byCategory, byStop, one dailySpend row per day, overspend. */
  budget: (id) => api.get(`/trips/${id}/budget`).then((r) => r.data.data),

  /**
   * { trip, totalDays, stopCount, activityCount, days, byCity }
   * `days` covers every calendar day — empty ones included, which is what makes
   * an unplanned gap visible instead of silently collapsing.
   */
  itinerary: (id) => api.get(`/trips/${id}/itinerary`).then((r) => r.data.data),

  /** → { isPublic, publicSlug, path } */
  share: (id) => api.post(`/trips/${id}/share`).then((r) => r.data.data),

  /** → { isPublic: false } */
  unshare: (id) => api.delete(`/trips/${id}/share`).then((r) => r.data.data),

  /** Clones a public trip onto your account. → { tripId, stopCount, activityCount } */
  copy: (id) => api.post(`/trips/${id}/copy`).then((r) => r.data.data),

  /** multipart/form-data, field name `cover`. */
  uploadCover: (id, file) => {
    const form = new FormData();
    form.append('cover', file);
    return api
      .patch(`/trips/${id}/cover`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.data);
  },

  removeCover: (id) => api.delete(`/trips/${id}/cover`).then((r) => r.data.data),
};
