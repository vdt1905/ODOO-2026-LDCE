import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireFile, uploadSingleImage } from '../middleware/upload.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '../validators/user.validator.js';

const router = Router();

// Everything below is the signed-in user acting on their own account.
router.use(requireAuth);

router.patch('/me', validate(updateProfileSchema), userController.updateMe);

// Credential changes share the tighter auth rate limit.
router.post(
  '/me/password',
  authLimiter,
  validate(changePasswordSchema),
  userController.changePassword
);
router.delete('/me', authLimiter, validate(deleteAccountSchema), userController.deleteMe);

// Saved destinations (PDF feature 12)
router.get('/me/saved', userController.listSavedDestinations);
router.post('/me/saved/:cityId', userController.saveDestination);
router.delete('/me/saved/:cityId', userController.unsaveDestination);

router.patch(
  '/me/avatar',
  uploadSingleImage('avatar'),
  requireFile,
  userController.updateAvatar
);
router.delete('/me/avatar', userController.removeAvatar);

router.post(
  '/me/images',
  uploadSingleImage('image'),
  requireFile,
  userController.uploadGenericImage
);
// public_id contains slashes (folder/name), so match the rest of the path.
router.delete('/me/images/*', userController.deleteGenericImage);

export default router;
