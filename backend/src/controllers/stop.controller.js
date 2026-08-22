import mongoose from 'mongoose';
import { City, Stop, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { differenceInDays, toDateKey } from '../utils/dates.js';
import { loadOwnedTrip, resequence } from '../services/trip.service.js';

/**
 * Non-blocking sanity checks.
 *
 * Dates outside the trip range, or stops that overlap, are surfaced as
 * `warnings` rather than rejections — mid-edit a plan is legitimately
 * inconsistent, and blocking there makes the builder infuriating to use.
 */
const collectWarnings = ({ trip, stop, siblings }) => {
  const warnings = [];

  if (toDateKey(stop.startDate) < toDateKey(trip.startDate)) {
    warnings.push('This stop starts before the trip does');
  }
  if (toDateKey(stop.endDate) > toDateKey(trip.endDate)) {
    warnings.push('This stop ends after the trip does');
  }

  const overlap = siblings.find(
    (other) =>
      String(other._id) !== String(stop._id) &&
      toDateKey(stop.startDate) < toDateKey(other.endDate) &&
      toDateKey(other.startDate) < toDateKey(stop.endDate)
  );
  if (overlap) warnings.push('These dates overlap another stop on this trip');

  return warnings;
};

const loadCity = async (cityId) => {
  if (!mongoose.isValidObjectId(cityId)) throw ApiError.badRequest('That city does not exist');
  const city = await City.findById(cityId);
  if (!city) throw ApiError.badRequest('That city does not exist');
  return city;
};

/** GET /trips/:tripId/stops */
export const listStops = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { allowViewer: true });
  const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 }).populate('city').lean();

  return sendSuccess(res, { data: { items: stops } });
});

/** POST /trips/:tripId/stops */
export const createStop = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);
  const { cityId, order, ...payload } = req.body;

  const city = await loadCity(cityId);
  if (trip.destinationCountry && city.country !== trip.destinationCountry) {
    throw ApiError.unprocessable('Choose a city in the trip country', [
      { field: 'cityId', message: `This trip is limited to cities in ${trip.destinationCountry}` },
    ]);
  }

  const siblings = await Stop.find({ trip: trip._id }).sort({ order: 1 });
  const nextOrder = order ?? siblings.length;

  const stop = await Stop.create({
    ...payload,
    trip: trip._id,
    city: city._id,
    order: nextOrder,
  });

  // Inserting in the middle pushes everything after it down one slot.
  if (order !== undefined && order < siblings.length) {
    const reordered = siblings.map((s) => String(s._id));
    reordered.splice(order, 0, String(stop._id));
    await resequence(Stop, { trip: trip._id }, reordered);
  }

  await stop.populate('city');

  return sendCreated(res, {
    data: {
      stop,
      warnings: collectWarnings({ trip, stop, siblings }),
    },
    message: `${city.name} added to the trip`,
  });
});

/** PATCH /trips/:tripId/stops/:stopId */
export const updateStop = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  const stop = await Stop.findOne({ _id: req.params.stopId, trip: trip._id });
  if (!stop) throw ApiError.notFound('Stop not found');

  const { cityId, ...payload } = req.body;
  if (cityId) {
    const city = await loadCity(cityId);
    if (trip.destinationCountry && city.country !== trip.destinationCountry) {
      throw ApiError.unprocessable('Choose a city in the trip country', [
        { field: 'cityId', message: `This trip is limited to cities in ${trip.destinationCountry}` },
      ]);
    }
    stop.city = city._id;
  }
  Object.assign(stop, payload);

  if (stop.endDate < stop.startDate) {
    throw ApiError.unprocessable('Please check the highlighted fields', [
      { field: 'endDate', message: 'Departure must be on or after arrival' },
    ]);
  }

  await stop.save();
  await stop.populate('city');

  const siblings = await Stop.find({ trip: trip._id }).lean();

  return sendSuccess(res, {
    data: { stop, warnings: collectWarnings({ trip, stop, siblings }) },
    message: 'Stop updated',
  });
});

/** DELETE /trips/:tripId/stops/:stopId — takes its activities with it. */
export const deleteStop = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  const stop = await Stop.findOne({ _id: req.params.stopId, trip: trip._id });
  if (!stop) throw ApiError.notFound('Stop not found');

  const { deletedCount } = await TripActivity.deleteMany({ stop: stop._id });
  await stop.deleteOne();

  // Close the gap left in the ordering.
  const remaining = await Stop.find({ trip: trip._id }).sort({ order: 1 }).lean();
  await resequence(Stop, { trip: trip._id }, remaining.map((s) => String(s._id)));

  return sendSuccess(res, {
    data: { activityCount: deletedCount },
    message: 'Stop removed',
  });
});

/** PATCH /trips/:tripId/stops/reorder — body { orderedIds: [] } */
export const reorderStops = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);
  const { orderedIds } = req.body;

  const stops = await Stop.find({ trip: trip._id }).lean();
  const owned = new Set(stops.map((stop) => String(stop._id)));

  // Reject a partial list outright — silently renumbering half a trip is worse
  // than an error the client can retry.
  if (orderedIds.length !== stops.length || orderedIds.some((id) => !owned.has(String(id)))) {
    throw ApiError.badRequest('Send every stop id for this trip, in the new order');
  }

  await resequence(Stop, { trip: trip._id }, orderedIds);

  const items = await Stop.find({ trip: trip._id }).sort({ order: 1 }).populate('city').lean();
  return sendSuccess(res, { data: { items }, message: 'Order saved' });
});

/**
 * GET /trips/:tripId/stops/:stopId/days
 * The dates this stop covers — used to populate the day picker in the activity
 * drawer so a user cannot schedule an activity outside the stay.
 */
export const stopDays = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { allowViewer: true });

  const stop = await Stop.findOne({ _id: req.params.stopId, trip: trip._id }).lean();
  if (!stop) throw ApiError.notFound('Stop not found');

  const nights = Math.max(0, differenceInDays(stop.endDate, stop.startDate));

  return sendSuccess(res, {
    data: { startDate: stop.startDate, endDate: stop.endDate, nights },
  });
});
