import { Router } from 'express';
import * as tripController from '../controllers/trip.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireFile, uploadSingleImage } from '../middleware/upload.middleware.js';
import {
  createTripSchema,
  listTripsQuerySchema,
  updateTripSchema,
} from '../validators/trip.validator.js';
import stopRoutes from './stop.routes.js';
import tripActivityRoutes from './tripActivity.routes.js';

const router = Router();

// Every route below is the signed-in user acting on their own trips.
// Ownership itself is re-checked per trip in loadOwnedTrip().
router.use(requireAuth);

router.get('/', validate(listTripsQuerySchema, 'query'), tripController.listTrips);
router.post('/', validate(createTripSchema), tripController.createTrip);

// Before '/:tripId', or 'summary' is matched as a trip id.
router.get('/summary', tripController.tripsSummary);

router.get('/:tripId', tripController.getTrip);
router.patch('/:tripId', validate(updateTripSchema), tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

router.patch(
  '/:tripId/cover',
  uploadSingleImage('cover'),
  requireFile,
  tripController.updateCover
);
router.delete('/:tripId/cover', tripController.removeCover);

router.get('/:tripId/budget', tripController.getBudget);
router.get('/:tripId/itinerary', tripController.getItinerary);

router.post('/:tripId/share', tripController.shareTrip);
router.delete('/:tripId/share', tripController.unshareTrip);

router.post('/:tripId/copy', tripController.copyTripToMe);

// Nested resources — /trips/:tripId/stops and /trips/:tripId/activities
router.use('/:tripId/stops', stopRoutes);
router.use('/:tripId/activities', tripActivityRoutes);

export default router;
