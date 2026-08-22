import { api } from './client.js';

const base = (tripId) => `/trips/${tripId}/activities`;

/**
 * Activities scheduled onto a trip — distinct from the read-only catalog in
 * activity.api.js. An entry is either linked to a catalog activity (`activity`
 * populated, `customName` empty) or free-text (`activity: null`).
 *
 * Leaving `cost` and `durationMinutes` out of a create is deliberate: the
 * server then inherits them from the catalog entry. Sending `cost: 0` pins the
 * cost to zero instead, which is rarely what the user meant.
 */
export const tripActivityApi = {
  /** Sorted by date then order. Pass `{ stopId }` to scope to one stop. */
  list: (tripId, params = {}) =>
    api.get(base(tripId), { params }).then((r) => r.data.data.items),

  /** → { activity, warnings }. Needs `activityId` OR a non-blank `customName`. */
  create: (tripId, payload) => api.post(base(tripId), payload).then((r) => r.data.data),

  /**
   * → { activity, warnings }. Strict schema, no `order`.
   * `activityId: null` detaches the catalog link and keeps the custom name.
   */
  update: (tripId, activityId, payload) =>
    api.patch(`${base(tripId)}/${activityId}`, payload).then((r) => r.data.data),

  /**
   * Unlike stops, a partial list is fine here — send one day's ids in their new
   * order. The response is still EVERY activity on the trip, not just that day.
   */
  reorder: (tripId, orderedIds) =>
    api.patch(`${base(tripId)}/reorder`, { orderedIds }).then((r) => r.data.data.items),

  remove: (tripId, activityId) =>
    api.delete(`${base(tripId)}/${activityId}`).then((r) => r.data.data._id),
};
