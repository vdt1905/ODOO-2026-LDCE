import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireFile, uploadSingleImage } from '../middleware/upload.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

// Everything below is the signed-in user acting on their own account.
router.use(requireAuth);

router.patch('/me', validate(updateProfileSchema), userController.updateMe);

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
