import { api } from './client.js';

const base = (tripId) => `/trips/${tripId}/stops`;

/**
 * Stops are always nested under a trip — ownership is re-checked server-side on
 * every call, and a trip you do not own answers 404 rather than 403.
 *
 * Create and update both resolve to `{ stop, warnings }`. `warnings` is always
 * an array and never blocks the write: the server still saves a stop whose
 * dates fall outside the trip or overlap a neighbour, and just tells you. Show
 * them, do not treat them as errors.
 */
export const stopApi = {
  /** Lean stops sorted by `order`, each with its city fully populated. */
  list: (tripId) => api.get(base(tripId)).then((r) => r.data.data.items),

  /** → { stop, warnings }. Omit `order` to append to the end. */
  create: (tripId, payload) => api.post(base(tripId), payload).then((r) => r.data.data),

  /**
   * → { stop, warnings }. The server schema is strict: send only the keys you
   * are changing, and never `order` — reorder has its own endpoint.
   */
  update: (tripId, stopId, payload) =>
    api.patch(`${base(tripId)}/${stopId}`, payload).then((r) => r.data.data),

  /**
   * `orderedIds` must list EVERY stop on the trip. A partial list is rejected,
   * which is why the UI reorders a local copy of the full array and sends that.
   * Resolves to the re-sequenced list, same shape as `list`.
   */
  reorder: (tripId, orderedIds) =>
    api.patch(`${base(tripId)}/reorder`, { orderedIds }).then((r) => r.data.data.items),

  /** { startDate, endDate, nights } — the day picker wants nights + 1 days. */
  days: (tripId, stopId) =>
    api.get(`${base(tripId)}/${stopId}/days`).then((r) => r.data.data),

  /** Cascades to this stop's activities. → { activityCount } deleted. */
  remove: (tripId, stopId) =>
    api.delete(`${base(tripId)}/${stopId}`).then((r) => r.data.data),
};
