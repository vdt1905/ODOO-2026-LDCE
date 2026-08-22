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

  byId: (id) => api.get(`/trips/${id}`).then((r) => r.data.data.trip),

  /** `cityIds` become stops in the same request, in the order they were picked. */
  create: (payload) => api.post('/trips', payload).then((r) => r.data.data.trip),

  update: (id, payload) => api.patch(`/trips/${id}`, payload).then((r) => r.data.data.trip),

  remove: (id) => api.delete(`/trips/${id}`).then((r) => r.data.data.id),
};
