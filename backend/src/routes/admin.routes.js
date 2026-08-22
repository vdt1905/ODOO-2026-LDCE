import { Router } from 'express';
import { z } from 'zod';
import * as adminController from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Guarded on the server as well as the client — the client guard only hides
// the link, it does not protect the data.
router.use(requireAuth, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/popular-cities', adminController.popularCities);
router.get('/popular-activities', adminController.popularActivities);
router.get('/trends', adminController.getTrends);

router.get('/users', adminController.listUsers);
router.patch(
  '/users/:id',
  validate(z.object({ role: z.enum(['user', 'admin']) }).strict()),
  adminController.updateUserRole
);
router.delete('/users/:id', adminController.deleteUser);

export default router;
