import mongoose from 'mongoose';
import { Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Deep-clones a trip into another account: trip → stops → tripActivities.
 *
 * Copyable when the trip is public, or when the caller already owns it
 * (duplicating your own trip is the same operation).
 *
 * Old ids cannot be reused, so stop ids are remapped as we go — that mapping is
 * what keeps each copied activity attached to the right copied stop.
 */
export const copyTrip = async (tripId, userId) => {
  if (!mongoose.isValidObjectId(tripId)) throw ApiError.notFound('Trip not found');

  const source = await Trip.findById(tripId);
  if (!source) throw ApiError.notFound('Trip not found');

  const isOwner = String(source.user) === String(userId);
  if (!source.isPublic && !isOwner) {
    throw ApiError.forbidden('This trip is not shared publicly');
  }

  const copy = await Trip.create({
    user: userId,
    name: isOwner ? `${source.name} (copy)` : source.name,
    description: source.description,
    startDate: source.startDate,
    endDate: source.endDate,
    coverPhotoUrl: source.coverPhotoUrl,
    budgetLimit: source.budgetLimit,
    currency: source.currency,
    // A copy always starts private — publishing is the new owner's decision.
    isPublic: false,
    publicSlug: undefined,
    copiedFrom: source._id,
  });

  try {
    const stops = await Stop.find({ trip: source._id }).sort({ order: 1 }).lean();

    const stopIdMap = new Map();
    if (stops.length) {
      const created = await Stop.insertMany(
        stops.map((stop) => ({
          trip: copy._id,
          city: stop.city,
          order: stop.order,
          startDate: stop.startDate,
          endDate: stop.endDate,
          notes: stop.notes,
          transportCost: stop.transportCost,
          accommodationCost: stop.accommodationCost,
          mealBudgetPerDay: stop.mealBudgetPerDay,
        }))
      );
      stops.forEach((stop, index) => stopIdMap.set(String(stop._id), created[index]._id));
    }

    const activities = await TripActivity.find({ trip: source._id }).sort({ order: 1 }).lean();

    const clonedActivities = activities
      .map((activity) => {
        const newStopId = stopIdMap.get(String(activity.stop));
        // Skip anything orphaned in the source rather than writing a dangling ref.
        if (!newStopId) return null;
        return {
          trip: copy._id,
          stop: newStopId,
          activity: activity.activity,
          customName: activity.customName,
          date: activity.date,
          startTime: activity.startTime,
          durationMinutes: activity.durationMinutes,
          cost: activity.cost,
          notes: activity.notes,
          order: activity.order,
        };
      })
      .filter(Boolean);

    if (clonedActivities.length) await TripActivity.insertMany(clonedActivities);

    // Count the copy as a view of the original.
    if (!isOwner) await Trip.updateOne({ _id: source._id }, { $inc: { viewCount: 1 } });

    return {
      tripId: String(copy._id),
      stopCount: stops.length,
      activityCount: clonedActivities.length,
    };
  } catch (error) {
    // Never leave a half-copied trip behind.
    await Promise.all([
      TripActivity.deleteMany({ trip: copy._id }),
      Stop.deleteMany({ trip: copy._id }),
    ]);
    await Trip.deleteOne({ _id: copy._id });
    throw error;
  }
};
