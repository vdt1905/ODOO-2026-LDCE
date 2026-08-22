import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { deleteImage, uploadImage } from '../services/upload.service.js';

/** PATCH /users/me — profile fields only; email and password have their own flows. */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });

  return sendSuccess(res, {
    data: { user: user.toJSON() },
    message: 'Profile updated',
  });
});

/**
 * PATCH /users/me/avatar — multipart, field name `avatar`.
 *
 * Reuses the existing public_id when there is one, so Cloudinary overwrites in
 * place and the account never accumulates orphaned images.
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+avatarPublicId');

  const image = await uploadImage(req.file.buffer, {
    kind: 'avatar',
    publicId: user.avatarPublicId || undefined,
  });

  user.avatarUrl = image.url;
  user.avatarPublicId = image.publicId;
  await user.save();

  return sendSuccess(res, {
    data: { user: user.toJSON(), image },
    message: 'Profile photo updated',
  });
});

/** DELETE /users/me/avatar */
export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+avatarPublicId');

  if (!user.avatarUrl) throw ApiError.badRequest('There is no photo to remove');

  await deleteImage(user.avatarPublicId);
  user.avatarUrl = '';
  user.avatarPublicId = '';
  await user.save();

  return sendSuccess(res, {
    data: { user: user.toJSON() },
    message: 'Profile photo removed',
  });
});

/**
 * POST /users/me/images — generic authenticated image upload.
 *
 * Exists so the trip-cover and activity-image screens can upload before their
 * own resource endpoints are built: upload here, then PATCH the returned URL
 * onto the resource.
 */
export const uploadGenericImage = asyncHandler(async (req, res) => {
  const kind = req.query.kind === 'tripCover' ? 'tripCover' : 'misc';
  const image = await uploadImage(req.file.buffer, { kind });

  return sendSuccess(res, { data: { image }, message: 'Image uploaded' });
});

/** DELETE /users/me/images/:publicId — cleans up an image this user uploaded. */
export const deleteGenericImage = asyncHandler(async (req, res) => {
  // publicId contains slashes, so the route captures it as a wildcard.
  const publicId = req.params[0];
  if (!publicId) throw ApiError.badRequest('Missing image id');

  const removed = await deleteImage(publicId);
  return sendSuccess(res, {
    data: { removed },
    message: removed ? 'Image deleted' : 'Image could not be deleted',
  });
});
