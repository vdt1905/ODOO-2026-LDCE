import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { generateTripSchema } from '../validators/ai.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/status', aiController.aiStatus);

// requireAuth runs first (above), so the limiter can key on req.user._id.
router.post(
  '/generate-trip',
  aiLimiter,
  validate(generateTripSchema),
  aiController.generateTripFromPrompt
);

export default router;
