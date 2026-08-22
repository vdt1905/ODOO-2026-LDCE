import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cityRoutes from './city.routes.js';
import userRoutes from './user.routes.js';
import tripRoutes from './trip.routes.js';
import activityRoutes from './activity.routes.js';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'GlobeTrotter API is up', data: { uptime: process.uptime() } })
);

router.use('/auth', authRoutes);
router.use('/cities', cityRoutes);
router.use('/activities', activityRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);

export default router;
