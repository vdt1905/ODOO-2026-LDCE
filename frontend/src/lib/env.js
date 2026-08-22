/** Client-side config. Keep the upload limits in sync with backend/.env. */
export const env = {
  // Same-origin in development so Vite can proxy API and auth-cookie traffic
  // regardless of which local port it selected. A deployed app can override it.
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',

  // The LangGraph suggestions service in AI/ — a separate FastAPI process on
  // :8000, not part of the Express API. It has its own response shape (no
  // { success, message, data } envelope) and its own client, so it deliberately
  // does not share `apiUrl`. Ask AI degrades to an offline notice when this is
  // not running, which is the common case on a fresh checkout.
  aiServiceUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1',

  maxUploadMb: Number(import.meta.env.VITE_UPLOAD_MAX_MB) || 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
};
