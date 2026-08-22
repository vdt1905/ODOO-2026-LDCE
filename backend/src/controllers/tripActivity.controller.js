import mongoose from 'mongoose';
import { Activity, Stop, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { toDateKey } from '../utils/dates.js';
import { loadOwnedTrip, resequence } from '../services/trip.service.js';

const loadStop = async (stopId, tripId) => {
  if (!mongoose.isValidObjectId(stopId)) throw ApiError.badRequest('That stop does not exist');
  const stop = await Stop.findOne({ _id: stopId, trip: tripId });
  if (!stop) throw ApiError.badRequest('That stop does not belong to this trip');
  return stop;
};

/** Flags a date outside the stay without blocking the edit. */
const dateWarning = (stop, date) => {
  const key = toDateKey(date);
  if (key < toDateKey(stop.startDate) || key > toDateKey(stop.endDate)) {
    return ['This date falls outside the stay at this stop'];
  }
  return [];
};

/** GET /trips/:tripId/activities — flat list, optionally filtered to one stop. */
export const listTripActivities = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { allowViewer: true });

  const filter = { trip: trip._id };
  if (req.query.stopId) filter.stop = req.query.stopId;

  const items = await TripActivity.find(filter)
    .sort({ date: 1, order: 1 })
    .populate('activity')
    .lean();

  return sendSuccess(res, { data: { items } });
});

/** POST /trips/:tripId/activities — attaches a catalog activity or a custom one. */
export const createTripActivity = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);
  const { stopId, activityId, order, ...payload } = req.body;

  const stop = await loadStop(stopId, trip._id);

  let catalogActivity = null;
  if (activityId) {
    if (!mongoose.isValidObjectId(activityId)) {
      throw ApiError.badRequest('That activity does not exist');
    }
    catalogActivity = await Activity.findById(activityId);
    if (!catalogActivity) throw ApiError.badRequest('That activity does not exist');
    if (String(catalogActivity.city) !== String(stop.city)) {
      throw ApiError.badRequest('Choose an activity from the same city as this stop');
    }
  }

  // Default cost and duration from the catalog when the client did not send them.
  const cost = payload.cost ?? catalogActivity?.cost ?? 0;
  const durationMinutes = payload.durationMinutes ?? catalogActivity?.durationMinutes ?? 60;

  const sameDay = await TripActivity.countDocuments({ trip: trip._id, date: payload.date });

  const activity = await TripActivity.create({
    ...payload,
    cost,
    durationMinutes,
    trip: trip._id,
    stop: stop._id,
    activity: catalogActivity?._id || null,
    customName: catalogActivity ? '' : payload.customName?.trim() || '',
    order: order ?? sameDay,
  });

  await activity.populate('activity');

  return sendCreated(res, {
    data: { activity, warnings: dateWarning(stop, activity.date) },
    message: `${catalogActivity?.name || activity.customName} added`,
  });
});

/** PATCH /trips/:tripId/activities/:activityId */
export const updateTripActivity = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  const activity = await TripActivity.findOne({
    _id: req.params.activityId,
    trip: trip._id,
  });
  if (!activity) throw ApiError.notFound('Activity not found');

  const { stopId, activityId, ...payload } = req.body;

  let stop = null;
  if (stopId) {
    stop = await loadStop(stopId, trip._id);
    activity.stop = stop._id;
  } else {
    stop = await Stop.findById(activity.stop);
  }

  if (activityId !== undefined) {
    if (activityId === null) {
      activity.activity = null;
    } else {
      const catalogActivity = await Activity.findById(activityId);
      if (!catalogActivity) throw ApiError.badRequest('That activity does not exist');
      if (String(catalogActivity.city) !== String(stop.city)) {
        throw ApiError.badRequest('Choose an activity from the same city as this stop');
      }
      activity.activity = catalogActivity._id;
      activity.customName = '';
    }
  }

  Object.assign(activity, payload);
  await activity.save();
  await activity.populate('activity');

  return sendSuccess(res, {
    data: { activity, warnings: stop ? dateWarning(stop, activity.date) : [] },
    message: 'Activity updated',
  });
});

/** DELETE /trips/:tripId/activities/:activityId */
export const deleteTripActivity = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  const activity = await TripActivity.findOneAndDelete({
    _id: req.params.activityId,
    trip: trip._id,
  });
  if (!activity) throw ApiError.notFound('Activity not found');

  return sendSuccess(res, { data: { _id: String(activity._id) }, message: 'Activity removed' });
});

/**
 * PATCH /trips/:tripId/activities/reorder — body { orderedIds: [] }
 * Scoped to one day: the ids sent are the activities of a single date, in the
 * order they should appear.
 */
export const reorderTripActivities = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);
  const { orderedIds } = req.body;

  const owned = await TripActivity.find({
    trip: trip._id,
    _id: { $in: orderedIds },
  }).lean();

  if (owned.length !== orderedIds.length) {
    throw ApiError.badRequest('Some of those activities do not belong to this trip');
  }

  const dateKeys = new Set(owned.map((activity) => toDateKey(activity.date)));
  if (dateKeys.size !== 1) {
    throw ApiError.badRequest('Reorder activities one day at a time');
  }

  const dayKey = [...dateKeys][0];
  const allForDay = (await TripActivity.find({ trip: trip._id }).lean()).filter(
    (activity) => toDateKey(activity.date) === dayKey
  );
  const received = new Set(orderedIds.map(String));
  if (allForDay.length !== orderedIds.length || allForDay.some((activity) => !received.has(String(activity._id)))) {
    throw ApiError.badRequest('Send every activity for that day, in the new order');
  }

  await resequence(TripActivity, { trip: trip._id }, orderedIds);

  const items = await TripActivity.find({ trip: trip._id })
    .sort({ date: 1, order: 1 })
    .populate('activity')
    .lean();

  return sendSuccess(res, { data: { items }, message: 'Order saved' });
});
