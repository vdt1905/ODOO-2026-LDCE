import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

/* --------------------------------------------------------------------------
   Access token lives in memory only. The store registers its getter/setter
   here at boot, which keeps this module free of a circular import on the store.
-------------------------------------------------------------------------- */
let accessToken = null;
let onSessionExpired = () => {};

export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;
export const onUnauthorized = (handler) => {
  onSessionExpired = handler;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/** Normalises every axios failure into a plain, renderable shape. */
export const toApiError = (error) => {
  const res = error?.response;
  return {
    status: res?.status ?? 0,
    message:
      res?.data?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the server. Is the API running?'
        : 'Something went wrong. Please try again.'),
    errors: res?.data?.errors || [],
  };
};

const REFRESH_URL = '/auth/refresh';

// Queue parallel 401s so a burst of requests triggers exactly one refresh.
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isRetryable =
      status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes(REFRESH_URL) &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/register');

    if (!isRetryable) return Promise.reject(error);

    original._retried = true;

    try {
      refreshing = refreshing || api.post(REFRESH_URL).finally(() => {
        refreshing = null;
      });
      const { data } = await refreshing;
      setAccessToken(data.data.accessToken);
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      onSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);
