import { api } from './client.js';

/** Every call here needs an admin account; a normal user gets a 403. */
export const adminApi = {
  /** Flat counters — users, trips, cities, activities, averages. */
  stats: () => api.get('/admin/stats').then((r) => r.data.data),

  /** { items: [{ cityId, name, country, region, costIndex, stops, tripCount }] } */
  popularCities: (limit = 8) =>
    api.get('/admin/popular-cities', { params: { limit } }).then((r) => r.data.data.items),

  /**
   * → { items, byType }
   * Only catalog-linked activities are counted; custom entries are invisible
   * here, so these totals are lower than the raw activity count in `stats`.
   */
  popularActivities: (limit = 8) =>
    api.get('/admin/popular-activities', { params: { limit } }).then((r) => r.data.data),

  /** { days, series } — `series` is zero-filled, one row per day, oldest first. */
  trends: (days = 30) =>
    api.get('/admin/trends', { params: { days } }).then((r) => r.data.data),

  /** { items, total, page, pages }. Params: search, role, page, limit. */
  users: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data.data),

  /** Server refuses to let you change your own role. */
  setRole: (id, role) => api.patch(`/admin/users/${id}`, { role }).then((r) => r.data.data.user),

  /** Cascades to every trip the user owns. → { tripsRemoved } */
  removeUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data.data),
};
