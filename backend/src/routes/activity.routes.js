import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';

const router = Router();

// Catalog data is public — the builder's activity drawer and Activity Search
// both read it, and neither needs a session to browse.
router.get('/', activityController.listActivities);
router.get('/meta', activityController.activityMeta);
router.get('/:id', activityController.getActivity);

export default router;
