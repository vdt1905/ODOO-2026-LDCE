import { Router } from 'express';
import * as cityController from '../controllers/city.controller.js';

const router = Router();

// Catalog data is public — the landing page reads it before anyone signs in.
router.get('/', cityController.listCities);
router.get('/popular', cityController.popularCities);
router.get('/:id', cityController.getCity);

export default router;
