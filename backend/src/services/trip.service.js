import mongoose from 'mongoose';
import { Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteImage } from './upload.service.js';

/**
 * The single ownership guard for every trip-scoped route.
 *
 * Returns 404 — not 403 — when the trip exists but belongs to someone else.
 * A 403 would confirm that a given id is a real trip, which is information a
 * stranger should not be able to probe for.
 *
 * The client-side route guard is UX only; THIS is the security boundary.
 */
export const loadOwnedTrip = async (tripId, userId, { select } = {}) => {
  if (!mongoose.isValidObjectId(tripId)) throw ApiError.notFound('Trip not found');

  const query = Trip.findOne({ _id: tripId, user: userId });
  if (select) query.select(select);

  const trip = await query;
  if (!trip) throw ApiError.notFound('Trip not found');

  return trip;
};

/** Loads a trip with its stops (→ city) and every activity (→ catalog entry). */
export const loadTripGraph = async (tripId, userId) => {
  const trip = await loadOwnedTrip(tripId, userId);

  const [stops, activities] = await Promise.all([
    Stop.find({ trip: trip._id }).sort({ order: 1 }).populate('city').lean(),
    TripActivity.find({ trip: trip._id })
      .sort({ date: 1, order: 1 })
      .populate('activity')
      .lean(),
  ]);

  return { trip, stops, activities };
};

/**
 * Removes a trip and everything hanging off it.
 * Mongo has no ON DELETE CASCADE, so the cascade is explicit — forgetting it
 * is how a database fills with orphaned stops.
 */
export const deleteTripCascade = async (trip) => {
  const [{ deletedCount: activityCount }, { deletedCount: stopCount }] = await Promise.all([
    TripActivity.deleteMany({ trip: trip._id }),
    Stop.deleteMany({ trip: trip._id }),
  ]);

  if (trip.coverPublicId) await deleteImage(trip.coverPublicId);
  await trip.deleteOne();

  return { stopCount, activityCount };
};

/** Renumbers `order` to 0..n-1 after an insert, delete or drag-reorder. */
export const resequence = async (Model, filter, orderedIds) => {
  await Model.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: { filter: { ...filter, _id: id }, update: { $set: { order: index } } },
    }))
  );
};
