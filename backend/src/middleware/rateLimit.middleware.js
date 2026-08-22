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
