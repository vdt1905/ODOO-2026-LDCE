import { api } from './client.js';

/**
 * Multipart requests must NOT carry the client's default JSON content-type —
 * axios sets the multipart boundary itself when the header is left undefined.
 */
const multipart = { headers: { 'Content-Type': undefined } };

export const userApi = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data.data.user),

  changePassword: (payload) => api.post('/users/me/password', payload).then((r) => r.data),

  deleteAccount: (password) =>
    api.delete('/users/me', { data: { password } }).then((r) => r.data.data),

  savedDestinations: () => api.get('/users/me/saved').then((r) => r.data.data.items),

  saveDestination: (cityId) =>
    api.post(`/users/me/saved/${cityId}`).then((r) => r.data.data.items),

  unsaveDestination: (cityId) =>
    api.delete(`/users/me/saved/${cityId}`).then((r) => r.data.data.items),

  uploadAvatar: (file, { onProgress } = {}) => {
    const form = new FormData();
    form.append('avatar', file);

    return api
      .patch('/users/me/avatar', form, {
        ...multipart,
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((r) => r.data.data.user);
  },

  removeAvatar: () => api.delete('/users/me/avatar').then((r) => r.data.data.user),

  /** Generic image upload — returns { url, publicId, width, height }. */
  uploadImage: (file, { kind = 'misc', onProgress } = {}) => {
    const form = new FormData();
    form.append('image', file);

    return api
      .post('/users/me/images', form, {
        ...multipart,
        params: { kind },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((r) => r.data.data.image);
  },

  deleteImage: (publicId) =>
    api.delete(`/users/me/images/${publicId}`).then((r) => r.data.data.removed),
};
