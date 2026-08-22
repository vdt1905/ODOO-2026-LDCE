import { City, Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { addDays, differenceInDays, startOfUTCDay } from '../utils/dates.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { publicSlug } from '../utils/slug.js';
import { deleteTripCascade, loadOwnedTrip, loadTripGraph } from '../services/trip.service.js';
import { buildBudget } from '../services/budget.service.js';
import { buildItinerary } from '../services/itinerary.service.js';
import { copyTrip } from '../services/copyTrip.service.js';
import { deleteImage, uploadImage } from '../services/upload.service.js';

const SORTS = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  'start-asc': { startDate: 1 },
  'start-desc': { startDate: -1 },
};

/**
 * Mongoose does not apply virtuals to .lean() results (that needs the
 * mongoose-lean-virtuals plugin), so list rows compute `status` explicitly.
 * Keep this in sync with the virtual on the Trip model.
 */
const statusOf = (trip) => {
  const today = startOfUTCDay(new Date());
  if (startOfUTCDay(trip.endDate) < today) return 'completed';
  if (startOfUTCDay(trip.startDate) > today) return 'upcoming';
  return 'ongoing';
};

/**
 * Turns ?status= into a date filter — `status` is a virtual, so it can't be queried.
 * Compared at the UTC day boundary, matching the Trip model's virtual: a trip
 * whose last day is today is still ongoing, and must not drop out of the
 * "Ongoing" filter just because the clock passed midnight UTC of that day.
 */
const statusFilter = (status) => {
  const today = startOfUTCDay(new Date());
  if (status === 'completed') return { endDate: { $lt: today } };
  if (status === 'upcoming') return { startDate: { $gt: today } };
  if (status === 'ongoing') return { startDate: { $lte: today }, endDate: { $gte: today } };
  return {};
};

/** GET /trips */
export const listTrips = asyncHandler(async (req, res) => {
  const { status, visibility, search, sort, page, limit } = req.query;

  const filter = { user: req.user._id, ...statusFilter(status) };
  if (visibility === 'public') filter.isPublic = true;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .sort(SORTS[sort] || SORTS['start-desc'])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trip.countDocuments(filter),
  ]);

  // One grouped query each — stops (with city names, for the card's "Paris,
  // Rome" line) and activity costs — rather than N queries inside a map.
  const ids = trips.map((trip) => trip._id);
  const [stops, activityCounts] = await Promise.all([
    Stop.find({ trip: { $in: ids } })
      .select('trip city order startDate endDate transportCost accommodationCost mealBudgetPerDay')
      .sort('order')
      .populate('city', 'name')
      .lean(),
    TripActivity.aggregate([
      { $match: { trip: { $in: ids } } },
      { $group: { _id: '$trip', count: { $sum: 1 }, cost: { $sum: '$cost' } } },
    ]),
  ]);

  const stopsBy = new Map();
  stops.forEach((stop) => {
    const key = String(stop.trip);
    if (!stopsBy.has(key)) stopsBy.set(key, []);
    stopsBy.get(key).push(stop);
  });
  const actsBy = Object.fromEntries(activityCounts.map((row) => [String(row._id), row]));

  const items = trips.map((trip) => {
    const tripStops = stopsBy.get(String(trip._id)) || [];
    // Same formula as budget.service.js's `total`, minus the day-by-day spread
    // a list card has no use for — so this figure never disagrees with the
    // budget screen for the same trip.
    const stopCost = tripStops.reduce((sum, stop) => {
      const nights = Math.max(0, differenceInDays(stop.endDate, stop.startDate));
      return (
        sum + (stop.transportCost || 0) + (stop.accommodationCost || 0) + (stop.mealBudgetPerDay || 0) * nights
      );
    }, 0);
    const activityCost = actsBy[String(trip._id)]?.cost || 0;

    return {
      ...trip,
      status: statusOf(trip),
      stopCount: tripStops.length,
      cityNames: tripStops.map((stop) => stop.city?.name).filter(Boolean),
      activityCount: actsBy[String(trip._id)]?.count || 0,
      plannedCost: activityCost,
      estimatedTotal: Math.round((stopCost + activityCost) * 100) / 100,
      days: differenceInDays(trip.endDate, trip.startDate) + 1,
      nights: differenceInDays(trip.endDate, trip.startDate),
    };
  });

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /trips/stats — totals for the dashboard's budget strip, unfiltered by list controls. */
export const tripStats = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user._id })
    .select('name startDate endDate currency')
    .lean();

  const ids = trips.map((trip) => trip._id);
  const [stops, activityCosts] = await Promise.all([
    Stop.find({ trip: { $in: ids } })
      .select('city startDate endDate transportCost accommodationCost mealBudgetPerDay')
      .lean(),
    TripActivity.aggregate([{ $match: { trip: { $in: ids } } }, { $group: { _id: null, cost: { $sum: '$cost' } } }]),
  ]);

  // "Planned spend" must match the sum of the cards below it, so it uses the
  // same stop-cost formula as listTrips rather than counting activities alone.
  const stopCost = stops.reduce((sum, stop) => {
    const nights = Math.max(0, differenceInDays(stop.endDate, stop.startDate));
    return sum + (stop.transportCost || 0) + (stop.accommodationCost || 0) + (stop.mealBudgetPerDay || 0) * nights;
  }, 0);
  const cityCount = new Set(stops.map((stop) => String(stop.city))).size;

  let upcomingCount = 0;
  let ongoingCount = 0;
  let completedCount = 0;
  let nextTrip = null;

  trips.forEach((trip) => {
    const status = statusOf(trip);
    if (status === 'upcoming') {
      upcomingCount += 1;
      if (!nextTrip || trip.startDate < nextTrip.startDate) nextTrip = trip;
    } else if (status === 'ongoing') {
      ongoingCount += 1;
    } else {
      completedCount += 1;
    }
  });

  return sendSuccess(res, {
    data: {
      stats: {
        tripCount: trips.length,
        upcomingCount,
        ongoingCount,
        completedCount,
        cityCount,
        plannedTotal: Math.round((stopCost + (activityCosts[0]?.cost || 0)) * 100) / 100,
        currency: trips[0]?.currency || 'USD',
        nextTrip: nextTrip ? { name: nextTrip.name, startDate: nextTrip.startDate } : null,
      },
    },
  });
});

/** POST /trips — optionally seeds stops from the cities picked on the create screen. */
export const createTrip = asyncHandler(async (req, res) => {
  const { cityIds = [], ...payload } = req.body;

  const trip = await Trip.create({ ...payload, user: req.user._id });

  if (cityIds.length) {
    const cities = await City.find({ _id: { $in: cityIds } }).lean();

    // Split the trip evenly across the chosen cities; the user re-drags after.
    const totalNights = Math.max(1, differenceInDays(trip.endDate, trip.startDate));
    const per = Math.max(1, Math.floor(totalNights / cities.length));

    let cursor = trip.startDate;
    const stops = cities.map((city, index) => {
      const isLast = index === cities.length - 1;
      const startDate = cursor;
      const endDate = isLast ? trip.endDate : addDays(startDate, per);
      cursor = endDate;
      return {
        trip: trip._id,
        city: city._id,
        order: index,
        startDate,
        endDate,
      };
    });

    if (stops.length) await Stop.insertMany(stops);
  }

  // toJSON (not lean) so the `status` virtual is present on the created trip.
  return sendCreated(res, { data: { trip: trip.toJSON() }, message: 'Trip created' });
});

/** GET /trips/:tripId — the full object graph the builder renders from. */
export const getTrip = asyncHandler(async (req, res) => {
  const { trip, stops, activities } = await loadTripGraph(req.params.tripId, req.user._id);

  // Attach each activity to its stop so the client does not have to regroup.
  const byStop = new Map(stops.map((stop) => [String(stop._id), []]));
  activities.forEach((activity) => {
    byStop.get(String(activity.stop))?.push(activity);
  });

  return sendSuccess(res, {
    data: {
      trip: {
        ...trip.toObject({ virtuals: true }),
        stops: stops.map((stop) => ({ ...stop, activities: byStop.get(String(stop._id)) || [] })),
      },
    },
  });
});

/** PATCH /trips/:tripId */
export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  Object.assign(trip, req.body);

  // Guard the half-update case: patching only one end of the range must still
  // leave a valid range.
  if (trip.endDate < trip.startDate) {
    throw ApiError.unprocessable('Please check the highlighted fields', [
      { field: 'endDate', message: 'End date must be on or after the start date' },
    ]);
  }

  await trip.save();
  return sendSuccess(res, { data: { trip: trip.toJSON() }, message: 'Trip updated' });
});

/** DELETE /trips/:tripId — cascades to stops, activities and the cover image. */
export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { select: '+coverPublicId' });
  const removed = await deleteTripCascade(trip);

  return sendSuccess(res, { data: removed, message: 'Trip deleted' });
});

/** PATCH /trips/:tripId/cover — multipart, field `cover`. */
export const updateCover = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { select: '+coverPublicId' });

  const image = await uploadImage(req.file.buffer, {
    kind: 'tripCover',
    publicId: trip.coverPublicId || undefined,
  });

  trip.coverPhotoUrl = image.url;
  trip.coverPublicId = image.publicId;
  await trip.save();

  return sendSuccess(res, { data: { trip: trip.toJSON(), image }, message: 'Cover updated' });
});

/** DELETE /trips/:tripId/cover */
export const removeCover = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id, { select: '+coverPublicId' });

  if (!trip.coverPhotoUrl) throw ApiError.badRequest('There is no cover photo to remove');

  await deleteImage(trip.coverPublicId);
  trip.coverPhotoUrl = '';
  trip.coverPublicId = '';
  await trip.save();

  return sendSuccess(res, { data: { trip: trip.toJSON() }, message: 'Cover removed' });
});

/** GET /trips/:tripId/budget — every number the budget screen renders. */
export const getBudget = asyncHandler(async (req, res) => {
  const { trip, stops, activities } = await loadTripGraph(req.params.tripId, req.user._id);
  return sendSuccess(res, { data: buildBudget({ trip, stops, activities }) });
});

/** GET /trips/:tripId/itinerary — day-by-day, ready to render. */
export const getItinerary = asyncHandler(async (req, res) => {
  const { trip, stops, activities } = await loadTripGraph(req.params.tripId, req.user._id);
  return sendSuccess(res, { data: buildItinerary({ trip, stops, activities }) });
});

/** POST /trips/:tripId/share — publishes and mints a slug (idempotent). */
export const shareTrip = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  trip.isPublic = true;
  if (!trip.publicSlug) trip.publicSlug = publicSlug();
  await trip.save();

  return sendSuccess(res, {
    data: { isPublic: true, publicSlug: trip.publicSlug, path: `/t/${trip.publicSlug}` },
    message: 'Trip published',
  });
});

/**
 * DELETE /trips/:tripId/share — unpublishes.
 * The slug is kept so re-sharing restores the same URL for anyone who saved it.
 */
export const unshareTrip = asyncHandler(async (req, res) => {
  const trip = await loadOwnedTrip(req.params.tripId, req.user._id);

  trip.isPublic = false;
  await trip.save();

  return sendSuccess(res, { data: { isPublic: false }, message: 'Trip is private again' });
});

/** POST /trips/:tripId/copy — deep-clones any public trip into the caller's account. */
export const copyTripToMe = asyncHandler(async (req, res) => {
  const result = await copyTrip(req.params.tripId, req.user._id);
  return sendCreated(res, { data: result, message: 'Trip copied to your account' });
});
