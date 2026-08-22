import { City, Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { addDays, differenceInDays } from '../utils/dates.js';
import { publicSlug } from '../utils/slug.js';
import { deleteTripCascade, loadOwnedTrip, loadTripGraph } from '../services/trip.service.js';
import { buildBudget, estimateTripCosts } from '../services/budget.service.js';
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
  const today = new Date();
  if (trip.endDate < today) return 'completed';
  if (trip.startDate > today) return 'upcoming';
  return 'ongoing';
};

/** Turns ?status= into a date filter — `status` is a virtual, so it can't be queried. */
const statusFilter = (status) => {
  const today = new Date();
  if (status === 'completed') return { endDate: { $lt: today } };
  if (status === 'upcoming') return { startDate: { $gt: today } };
  if (status === 'ongoing') return { startDate: { $lte: today }, endDate: { $gte: today } };
  return {};
};

/** GET /trips */
export const listTrips = asyncHandler(async (req, res) => {
  const { status, search, sort, page, limit } = req.query;

  const filter = { user: req.user._id, ...statusFilter(status) };
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .sort(SORTS[sort] || SORTS['start-desc'])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trip.countDocuments(filter),
  ]);

  // One shared estimator for the whole page — same maths as /budget, so a card
  // and the budget screen can never show different numbers.
  const costs = await estimateTripCosts(trips.map((trip) => trip._id));

  const items = trips.map((trip) => {
    const cost = costs.get(String(trip._id));
    return {
      ...trip,
      status: statusOf(trip),
      days: differenceInDays(trip.endDate, trip.startDate) + 1,
      stopCount: cost.stopCount,
      activityCount: cost.activityCount,
      cities: cost.cities,
      countries: cost.countries,
      // Full four-category total, not just activities.
      estimatedCost: cost.estimatedCost,
      costBreakdown: {
        transport: cost.transport,
        stay: cost.stay,
        meals: cost.meals,
        activities: cost.activities,
      },
    };
  });

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1 },
  });
});

/**
 * GET /trips/summary — the dashboard's "budget highlights" and quick counts.
 *
 * One call for the whole home screen: totals across every trip, the next trip
 * up, and a per-status breakdown. Without this the dashboard would have to hit
 * /trips/:id/budget once per trip.
 */
export const tripsSummary = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user._id }).lean();
  const costs = await estimateTripCosts(trips.map((trip) => trip._id));

  const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

  const totals = { transport: 0, stay: 0, meals: 0, activities: 0 };
  const byStatus = { upcoming: 0, ongoing: 0, completed: 0 };
  let totalPlanned = 0;
  let totalDays = 0;
  const visited = new Set();

  const enriched = trips.map((trip) => {
    const cost = costs.get(String(trip._id));
    const status = statusOf(trip);

    byStatus[status] += 1;
    totalPlanned += cost.estimatedCost;
    totalDays += differenceInDays(trip.endDate, trip.startDate) + 1;
    cost.cities.forEach((city) => visited.add(city));
    Object.keys(totals).forEach((key) => {
      totals[key] = round2(totals[key] + cost[key]);
    });

    return { trip, cost, status };
  });

  // Soonest trip that has not finished yet.
  const next = enriched
    .filter((row) => row.status !== 'completed')
    .sort((a, b) => new Date(a.trip.startDate) - new Date(b.trip.startDate))[0];

  return sendSuccess(res, {
    data: {
      tripCount: trips.length,
      byStatus,
      citiesPlanned: visited.size,
      totalDaysPlanned: totalDays,
      totalPlannedCost: round2(totalPlanned),
      avgTripCost: trips.length ? round2(totalPlanned / trips.length) : 0,
      byCategory: totals,
      nextTrip: next
        ? {
            _id: String(next.trip._id),
            name: next.trip.name,
            startDate: next.trip.startDate,
            endDate: next.trip.endDate,
            coverPhotoUrl: next.trip.coverPhotoUrl,
            currency: next.trip.currency,
            status: next.status,
            daysUntil: differenceInDays(next.trip.startDate, new Date()),
            estimatedCost: next.cost.estimatedCost,
            cities: next.cost.cities,
          }
        : null,
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
