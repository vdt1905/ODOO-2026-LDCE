import rateLimit from 'express-rate-limit';

const options = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down', errors: [] },
};

export const apiLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  max: 300,
});

/**
 * AI generation is the expensive endpoint — 5 per 15 minutes per user.
 * Keyed by user id, not IP, so a shared network (or a demo booth) does not
 * rate-limit everyone at once. Must be mounted after requireAuth.
 */
export const aiLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: {
    success: false,
    message: 'You have generated a few trips already — try again in 15 minutes.',
    errors: [],
  },
});

/** Tighter budget on credential endpoints to blunt brute-force attempts. */
export const authLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many attempts. Try again in 15 minutes.',
    errors: [],
  },
});
