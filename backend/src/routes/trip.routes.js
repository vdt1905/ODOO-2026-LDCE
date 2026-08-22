import { Router } from 'express';

import * as tripController from '../controllers/trip.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTripSchema,
  listTripsQuerySchema,
  updateTripSchema,
} from '../validators/trip.validator.js';

const router = Router();

// Trips are always personal — there is no anonymous view of this resource.
// The public, read-only itinerary lives behind /public/trips/:slug instead.
router.use(requireAuth);

// Registered before '/:id' so 'stats' is never parsed as a trip id.
router.get('/stats', tripController.tripStats);

router
  .route('/')
  .get(validate(listTripsQuerySchema, 'query'), tripController.listTrips)
  .post(validate(createTripSchema), tripController.createTrip);

router
  .route('/:id')
  .get(tripController.getTrip)
  .patch(validate(updateTripSchema), tripController.updateTrip)
  .delete(tripController.deleteTrip);

export default router;
