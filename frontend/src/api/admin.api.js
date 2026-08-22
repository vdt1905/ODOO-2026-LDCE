import { api } from './client.js';

const get = (path, params) => api.get(path, { params }).then((r) => r.data.data);

export const adminApi = {
  stats: () => get('/admin/stats'),
  cities: (params = {}) => get('/admin/popular-cities', params),
  activities: (params = {}) => get('/admin/popular-activities', params),
  trends: (params = {}) => get('/admin/trends', params),
  users: (params = {}) => get('/admin/users', params),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data.data),
  removeUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data.data),
};
