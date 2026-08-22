import mongoose from 'mongoose';
import { Trip, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { loadOwnedTrip } from '../services/trip.service.js';

const publicUserFields = 'firstName lastName email avatarUrl city country';

const serializeMembers = async (trip) => {
  const ids = [trip.user, ...(trip.members || []).map((member) => member.user)];
  const users = await User.find({ _id: { $in: ids } }).select(publicUserFields).lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));

  return [
    { user: byId.get(String(trip.user)), role: 'owner', invitedAt: trip.createdAt },
    ...(trip.members || []).map((member) => ({
      user: byId.get(String(member.user)),
      role: member.role,
      invitedAt: member.invitedAt,
    })),
  ].filter((member) => member.user);
};

/** GET /trips/:tripId/members - owners, editors and viewers can see who collaborates. */
export const listMembers = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { allowViewer: true });
  return sendSuccess(res, { data: { items: await serializeMembers(trip) } });
});

/** POST /trips/:tripId/members - owner invites an existing registered user. */
export const inviteMember = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { ownerOnly: true });
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw ApiError.notFound('Ask them to create a GlobeTrotter account first');
  if (String(user._id) === String(trip.user)) {
    throw ApiError.badRequest('You already own this trip');
  }
  if (trip.members.some((member) => String(member.user) === String(user._id))) {
    throw ApiError.conflict('That person is already collaborating on this trip');
  }

  trip.members.push({ user: user._id, role: req.body.role });
  await trip.save();

  return sendCreated(res, {
    data: { items: await serializeMembers(trip) },
    message: `${user.firstName} can now ${req.body.role === 'editor' ? 'edit' : 'view'} this trip`,
  });
});

/** PATCH /trips/:tripId/members/:userId - owner changes a collaborator role. */
export const updateMember = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { ownerOnly: true });
  if (!mongoose.isValidObjectId(req.params.userId)) throw ApiError.notFound('Collaborator not found');

  const member = trip.members.find((entry) => String(entry.user) === String(req.params.userId));
  if (!member) throw ApiError.notFound('Collaborator not found');
  member.role = req.body.role;
  await trip.save();

  return sendSuccess(res, { data: { items: await serializeMembers(trip) }, message: 'Collaborator role updated' });
});

/** DELETE /trips/:tripId/members/:userId - owner removes access. */
export const removeMember = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { ownerOnly: true });
  if (!mongoose.isValidObjectId(req.params.userId)) throw ApiError.notFound('Collaborator not found');

  const before = trip.members.length;
  trip.members = trip.members.filter((entry) => String(entry.user) !== String(req.params.userId));
  if (trip.members.length === before) throw ApiError.notFound('Collaborator not found');
  await trip.save();

  return sendSuccess(res, { data: { items: await serializeMembers(trip) }, message: 'Collaborator removed' });
});
