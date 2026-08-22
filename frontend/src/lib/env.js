/** Client-side config. Keep the upload limits in sync with backend/.env. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  maxUploadMb: Number(import.meta.env.VITE_UPLOAD_MAX_MB) || 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
};
