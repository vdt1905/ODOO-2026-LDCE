import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for environment configuration.
 * Nothing else in the codebase reads `process.env` directly — import from here,
 * so a missing variable fails loudly at boot instead of silently at request time.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,

  mongoUri: required('MONGO_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  /**
   * Optional on purpose — the API boots without Cloudinary so a teammate who
   * has not filled these in can still run auth and trips. Upload routes return
   * a clear 503 instead of crashing at import time.
   */
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'globetrotter',
    get isConfigured() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  upload: {
    maxFileSizeMb: Number(process.env.UPLOAD_MAX_MB) || 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  },

  cookie: {
    name: 'gt_refresh',
    // 7 days in ms — keep in sync with jwt.refreshExpiry
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
