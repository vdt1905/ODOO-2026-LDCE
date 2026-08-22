import { Router } from 'express';
import * as stopController from '../controllers/stop.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createStopSchema,
  reorderSchema,
  updateStopSchema,
} from '../validators/stop.validator.js';

// mergeParams so :tripId from the parent router is visible here.
const router = Router({ mergeParams: true });

router.get('/', stopController.listStops);
router.post('/', validate(createStopSchema), stopController.createStop);

// Declared before '/:stopId' — otherwise Express matches 'reorder' as an id.
router.patch('/reorder', validate(reorderSchema), stopController.reorderStops);

router.get('/:stopId/days', stopController.stopDays);
router.patch('/:stopId', validate(updateStopSchema), stopController.updateStop);
router.delete('/:stopId', stopController.deleteStop);

export default router;
