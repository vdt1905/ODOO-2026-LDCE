import { api } from './client.js';

export const aiApi = {
  status: () => api.get('/ai/status').then((r) => r.data.data),
  generate: (payload) => api.post('/ai/generate-trip', payload).then((r) => r.data.data),
};
