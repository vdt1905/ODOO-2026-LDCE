import mongoose from 'mongoose';

import { Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { diffInDays, todayUtc } from '../utils/dates.js';
import { seedStopsFromCities, summariseTrips, withSummary } from '../services/trip.service.js';

const SORTS = {
  soonest: { startDate: 1, createdAt: -1 },
  latest: { startDate: -1, createdAt: -1 },
  recent: { createdAt: -1 },
  name: { name: 1 },
};

/**
 * Turns the derived `status` into a date filter.
 *
 * `status` is a virtual, so it cannot be queried directly. These boundaries are
 * deliberately the same ones Trip's virtual uses, so a filtered list can never
 * contain a card whose badge disagrees with the filter.
 */
const statusFilter = (status) => {
  const today = todayUtc();

  if (status === 'completed') return { endDate: { $lt: today } };
  if (status === 'upcoming') return { startDate: { $gt: today } };
  if (status === 'ongoing') return { startDate: { $lte: today }, endDate: { $gte: today } };
  return {};
};

/**
 * Loads a trip the caller is allowed to touch.
 *
 * The client-side route guard is UX; this is the actual security boundary, so
 * every handler that reaches a single trip goes through here. A trip belonging
 * to someone else 404s rather than 403s — we do not confirm that it exists.
 */
const findOwnedTrip = async (tripId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) throw ApiError.notFound('Trip not found');

  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) throw ApiError.notFound('Trip not found');

  return trip;
};

/** GET /trips?status=&visibility=&search=&sort=&page=&limit= */
export const listTrips = asyncHandler(async (req, res) => {
  const { status, visibility, search, sort, page, limit } = req.query;

  const filter = { user: req.user._id, ...statusFilter(status) };
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
  if (visibility === 'public') filter.isPublic = true;
  if (visibility === 'private') filter.isPublic = false;

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .sort(SORTS[sort] || SORTS.soonest)
      .skip((page - 1) * limit)
      .limit(limit),
    Trip.countDocuments(filter),
  ]);

  const summaries = await summariseTrips(trips.map((trip) => trip._id));

  return sendSuccess(res, {
    data: {
      items: trips.map((trip) => withSummary(trip, summaries)),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * GET /trips/stats — the dashboard's "budget highlights" strip.
 *
 * Counts every trip the user owns, not just the current page, so the headline
 * number does not change when they filter the list below it.
 */
export const tripStats = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user: req.user._id }).sort({ startDate: 1 });
  const summaries = await summariseTrips(trips.map((trip) => trip._id));

  const today = todayUtc();
  let plannedTotal = 0;
  let upcomingCount = 0;
  let ongoingCount = 0;
  let completedCount = 0;
  const cities = new Set();
  let nextTrip = null;

  for (const trip of trips) {
    const summary = summaries.get(String(trip._id));
    plannedTotal += summary?.estimatedTotal ?? 0;
    summary?.cityNames.forEach((name) => cities.add(name));

    if (trip.status === 'upcoming') {
      upcomingCount += 1;
      if (!nextTrip) {
        nextTrip = {
          _id: trip._id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          daysAway: diffInDays(today, trip.startDate),
        };
      }
    } else if (trip.status === 'ongoing') {
      ongoingCount += 1;
    } else {
      completedCount += 1;
    }
  }

  return sendSuccess(res, {
    data: {
      stats: {
        tripCount: trips.length,
        upcomingCount,
        ongoingCount,
        completedCount,
        cityCount: cities.size,
        plannedTotal,
        currency: trips[0]?.currency || 'USD',
        nextTrip,
      },
    },
  });
});

/**
 * POST /trips
 *
 * `cityIds` lets the Create Trip screen hand over the cities the user
 * pre-selected, and they become stops in the same request — one round trip, and
 * no half-created trip if the browser closes between two calls.
 */
export const createTrip = asyncHandler(async (req, res) => {
  const { cityIds, ...fields } = req.body;

  const trip = await Trip.create({ ...fields, user: req.user._id });

  try {
    await seedStopsFromCities(trip, cityIds);
  } catch (error) {
    // Never leave a trip behind with half its stops — roll the whole thing back
    // so the user can fix the input and retry cleanly.
    await Stop.deleteMany({ trip: trip._id });
    await trip.deleteOne();
    throw error;
  }

  const summaries = await summariseTrips([trip._id]);

  return sendCreated(res, {
    data: { trip: withSummary(trip, summaries) },
    message: `${trip.name} is ready to plan`,
  });
});

/** GET /trips/:id */
export const getTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user._id);
  const summaries = await summariseTrips([trip._id]);

  return sendSuccess(res, { data: { trip: withSummary(trip, summaries) } });
});

/** PATCH /trips/:id — basics only; stops and activities have their own routes. */
export const updateTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user._id);

  // A shortened window can strand a stop outside the trip. That is the
  // builder's problem to surface and resolve, so nothing is blocked here.
  Object.assign(trip, req.body);
  await trip.save();
  const summaries = await summariseTrips([trip._id]);

  return sendSuccess(res, {
    data: { trip: withSummary(trip, summaries) },
    message: 'Trip updated',
  });
});

/** DELETE /trips/:id — cascades, because nothing else owns these rows. */
export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user._id);

  // Children first: a crash between the two must not orphan rows behind a
  // trip that no longer exists to clean them up.
  await TripActivity.deleteMany({ trip: trip._id });
  await Stop.deleteMany({ trip: trip._id });
  await trip.deleteOne();

  return sendSuccess(res, {
    data: { id: trip._id },
    message: `${trip.name} was deleted`,
  });
});
