import mongoose from 'mongoose';
import { City, Trip, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { deleteImage, uploadImage } from '../services/upload.service.js';
import { deleteTripCascade } from '../services/trip.service.js';
import { clearRefreshCookie } from '../services/token.service.js';

/** PATCH /users/me — profile fields, including email. */
export const updateMe = asyncHandler(async (req, res) => {
  const { email, ...rest } = req.body;

  if (email && email !== req.user.email) {
    // Check first so the client gets a field-level 409 instead of an E11000.
    const taken = await User.exists({ email, _id: { $ne: req.user._id } });
    if (taken) throw ApiError.conflict('That email is already in use');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...rest, ...(email ? { email } : {}) },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    data: { user: user.toJSON() },
    message: 'Profile updated',
  });
});

/**
 * POST /users/me/password — change password while signed in.
 * Distinct from /auth/reset-password, which is the signed-out token flow.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unprocessable('Please check the highlighted fields', [
      { field: 'currentPassword', message: 'That is not your current password' },
    ]);
  }

  // Assign and save (not updateOne) so the pre-save hook hashes it.
  user.password = newPassword;
  await user.save();

  return sendSuccess(res, { message: 'Password updated' });
});

/**
 * DELETE /users/me — irreversible.
 * Takes every trip (and its stops, activities and cover image) with it, plus
 * the avatar, so nothing is orphaned in Mongo or Cloudinary.
 */
export const deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +avatarPublicId');

  if (!(await user.comparePassword(req.body.password))) {
    throw ApiError.unprocessable('Please check the highlighted fields', [
      { field: 'password', message: 'Incorrect password' },
    ]);
  }

  const trips = await Trip.find({ user: user._id }).select('+coverPublicId');
  for (const trip of trips) {
    await deleteTripCascade(trip);
  }

  if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
  await Trip.updateMany({ 'members.user': user._id }, { $pull: { members: { user: user._id } } });
  await user.deleteOne();

  clearRefreshCookie(res);

  return sendSuccess(res, {
    data: { tripsRemoved: trips.length },
    message: 'Your account and all of its trips have been deleted',
  });
});

/* --------------------------------------------------------------------------
   Saved destinations — the "saved destinations list" of PDF feature 12.
   Stored as refs on the user, so the city itself stays a single source row.
-------------------------------------------------------------------------- */

/** GET /users/me/saved */
export const listSavedDestinations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedDestinations');
  return sendSuccess(res, { data: { items: user.savedDestinations } });
});

/** POST /users/me/saved/:cityId — idempotent via $addToSet. */
export const saveDestination = asyncHandler(async (req, res) => {
  const { cityId } = req.params;

  if (!mongoose.isValidObjectId(cityId)) throw ApiError.notFound('City not found');
  const city = await City.findById(cityId).lean();
  if (!city) throw ApiError.notFound('City not found');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedDestinations: city._id } },
    { new: true }
  ).populate('savedDestinations');

  return sendCreated(res, {
    data: { items: user.savedDestinations },
    message: `${city.name} saved`,
  });
});

/** DELETE /users/me/saved/:cityId */
export const unsaveDestination = asyncHandler(async (req, res) => {
  const { cityId } = req.params;
  if (!mongoose.isValidObjectId(cityId)) throw ApiError.notFound('City not found');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedDestinations: cityId } },
    { new: true }
  ).populate('savedDestinations');

  return sendSuccess(res, {
    data: { items: user.savedDestinations },
    message: 'Removed from saved destinations',
  });
});

/* -------------------------------------------------------------------------- */

/** PATCH /users/me/avatar — multipart, field name `avatar`. */
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
 * Lets a screen upload before its own resource endpoint exists: upload here,
 * then PATCH the returned URL onto the resource.
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
