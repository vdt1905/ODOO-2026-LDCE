import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * Cloudinary is configured once at import time.
 *
 * Uploads run server-side (the file streams through Express) rather than
 * unsigned from the browser, so the API secret never reaches the client and
 * every upload can be validated and folder-scoped before it lands.
 */
if (env.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  console.warn(
    '[cloudinary] not configured — image uploads will return 503. ' +
      'Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in backend/.env'
  );
}

/** Namespaced folders keep avatars, covers and activity images apart. */
export const FOLDERS = {
  avatars: `${env.cloudinary.folder}/avatars`,
  tripCovers: `${env.cloudinary.folder}/trip-covers`,
  misc: `${env.cloudinary.folder}/misc`,
};

export { cloudinary };
