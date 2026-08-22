import { api } from './client.js';

export const publicApi = {
  listTrips: (params = {}) => api.get('/public/trips', { params }).then((r) => r.data.data),
  trip: (slug) => api.get(`/public/trips/${slug}`).then((r) => r.data.data),
};
