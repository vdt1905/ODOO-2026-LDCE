import { api } from './client.js';

export const cityApi = {
  popular: (limit = 8) =>
    api.get('/cities/popular', { params: { limit } }).then((r) => r.data.data.items),

  list: (params = {}) => api.get('/cities', { params }).then((r) => r.data.data),

  byId: (id) => api.get(`/cities/${id}`).then((r) => r.data.data.city),
};
