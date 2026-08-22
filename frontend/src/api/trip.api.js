import { api } from './client.js';

const multipart = { headers: { 'Content-Type': undefined } };
const unwrap = (request) => request.then((response) => response.data.data);

export const tripApi = {
  list: (params = {}) => unwrap(api.get('/trips', { params })),
  summary: () => unwrap(api.get('/trips/summary')),
  create: (payload) => unwrap(api.post('/trips', payload)),
  get: (tripId) => unwrap(api.get(`/trips/${tripId}`)),
  update: (tripId, payload) => unwrap(api.patch(`/trips/${tripId}`, payload)),
  remove: (tripId) => unwrap(api.delete(`/trips/${tripId}`)),
  budget: (tripId) => unwrap(api.get(`/trips/${tripId}/budget`)),
  itinerary: (tripId) => unwrap(api.get(`/trips/${tripId}/itinerary`)),
  share: (tripId) => unwrap(api.post(`/trips/${tripId}/share`)),
  unshare: (tripId) => unwrap(api.delete(`/trips/${tripId}/share`)),
  copy: (tripId) => unwrap(api.post(`/trips/${tripId}/copy`)),
  updateCover: (tripId, file) => {
    const form = new FormData();
    form.append('cover', file);
    return unwrap(api.patch(`/trips/${tripId}/cover`, form, multipart));
  },
  removeCover: (tripId) => unwrap(api.delete(`/trips/${tripId}/cover`)),
  stops: {
    list: (tripId) => unwrap(api.get(`/trips/${tripId}/stops`)),
    create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/stops`, payload)),
    update: (tripId, stopId, payload) => unwrap(api.patch(`/trips/${tripId}/stops/${stopId}`, payload)),
    remove: (tripId, stopId) => unwrap(api.delete(`/trips/${tripId}/stops/${stopId}`)),
    reorder: (tripId, orderedIds) =>
      unwrap(api.patch(`/trips/${tripId}/stops/reorder`, { orderedIds })),
  },
  activities: {
    list: (tripId, params = {}) => unwrap(api.get(`/trips/${tripId}/activities`, { params })),
    create: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/activities`, payload)),
    update: (tripId, activityId, payload) =>
      unwrap(api.patch(`/trips/${tripId}/activities/${activityId}`, payload)),
    remove: (tripId, activityId) => unwrap(api.delete(`/trips/${tripId}/activities/${activityId}`)),
    reorder: (tripId, orderedIds) =>
      unwrap(api.patch(`/trips/${tripId}/activities/reorder`, { orderedIds })),
  },
  members: {
    list: (tripId) => unwrap(api.get(`/trips/${tripId}/members`)),
    invite: (tripId, payload) => unwrap(api.post(`/trips/${tripId}/members`, payload)),
    update: (tripId, userId, payload) =>
      unwrap(api.patch(`/trips/${tripId}/members/${userId}`, payload)),
    remove: (tripId, userId) => unwrap(api.delete(`/trips/${tripId}/members/${userId}`)),
  },
};
