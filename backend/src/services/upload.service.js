import { cloudinary, FOLDERS } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** Transformations applied at upload time, per kind of image. */
const PRESETS = {
  avatar: {
    folder: FOLDERS.avatars,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
  tripCover: {
    folder: FOLDERS.tripCovers,
    transformation: [
      { width: 1600, height: 900, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
  misc: {
    folder: FOLDERS.misc,
    transformation: [
      { width: 1600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
};

export const UPLOAD_KINDS = Object.keys(PRESETS);

const assertConfigured = () => {
  if (!env.cloudinary.isConfigured) {
    throw new ApiError(
      503,
      'Image uploads are not configured on this server yet. Add your Cloudinary keys to backend/.env.'
    );
  }
};

/**
 * Streams a multer memory buffer to Cloudinary.
 * Returns the trimmed fields we actually persist — the full Cloudinary
 * response is far larger than anything the app needs.
 */
export const uploadImage = (buffer, { kind = 'misc', publicId } = {}) => {
  assertConfigured();

  const preset = PRESETS[kind] || PRESETS.misc;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...preset,
        resource_type: 'image',
        // Passing the previous public_id overwrites in place, so replacing an
        // avatar does not leave an orphan behind.
        ...(publicId ? { public_id: publicId, overwrite: true, invalidate: true } : {}),
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(502, `Image upload failed: ${error.message}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    stream.end(buffer);
  });
};

/** Best-effort delete — a failure here must never break the request. */
export const deleteImage = async (publicId) => {
  if (!publicId || !env.cloudinary.isConfigured) return false;

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return true;
  } catch (error) {
    console.warn(`[cloudinary] could not delete ${publicId}: ${error.message}`);
    return false;
  }
};
