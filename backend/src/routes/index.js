import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cityRoutes from './city.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'GlobeTrotter API is up', data: { uptime: process.uptime() } })
);

router.use('/auth', authRoutes);
router.use('/cities', cityRoutes);

// Mounted as they are built: /users, /trips, /activities, /public, /admin

export default router;
