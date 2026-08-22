import { api } from './client.js';

export const activityApi = {
  list: (params = {}) => api.get('/activities', { params }).then((r) => r.data.data),
  meta: () => api.get('/activities/meta').then((r) => r.data.data),
  byId: (id) => api.get(`/activities/${id}`).then((r) => r.data.data.activity),
};
