import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Files are held in memory, never written to disk — the host filesystem is
 * ephemeral on Render/Vercel, and the buffer goes straight to Cloudinary.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!env.upload.allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Unsupported file type. Allowed: ${env.upload.allowedMimeTypes
          .map((type) => type.replace('image/', ''))
          .join(', ')}`
      )
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.upload.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
});

/**
 * Accepts one image on `field`, translating multer's own errors into the
 * standard ApiError envelope so the client always gets the same error shape.
 *
 *   router.patch('/me/avatar', requireAuth, uploadSingleImage('avatar'), controller)
 */
export const uploadSingleImage = (field = 'image') => (req, res, next) => {
  upload.single(field)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          ApiError.badRequest(`Image must be under ${env.upload.maxFileSizeMb}MB`)
        );
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(ApiError.badRequest(`Send the file in the "${field}" field`));
      }
      return next(ApiError.badRequest(error.message));
    }

    return next(error);
  });
};

/** Guards routes that require a file to have been sent. */
export const requireFile = (req, _res, next) => {
  if (!req.file) return next(ApiError.badRequest('No image was uploaded'));
  next();
};
