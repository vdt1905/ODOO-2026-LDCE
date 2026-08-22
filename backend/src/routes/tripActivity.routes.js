import { Router } from 'express';
import * as tripActivityController from '../controllers/tripActivity.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { reorderSchema } from '../validators/stop.validator.js';
import {
  createTripActivitySchema,
  updateTripActivitySchema,
} from '../validators/tripActivity.validator.js';

const router = Router({ mergeParams: true });

router.get('/', tripActivityController.listTripActivities);
router.post('/', validate(createTripActivitySchema), tripActivityController.createTripActivity);

// Before '/:activityId', or 'reorder' is read as an id.
router.patch('/reorder', validate(reorderSchema), tripActivityController.reorderTripActivities);

router.patch(
  '/:activityId',
  validate(updateTripActivitySchema),
  tripActivityController.updateTripActivity
);
router.delete('/:activityId', tripActivityController.deleteTripActivity);

export default router;
