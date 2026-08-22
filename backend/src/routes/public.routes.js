import { Router } from 'express';
import * as publicController from '../controllers/public.controller.js';

const router = Router();

// No auth anywhere in this file — everything served here goes through the
// allowlist serialiser in the controller.
router.get('/trips', publicController.listPublicTrips);
router.get('/trips/:slug', publicController.getPublicTrip);

export default router;
