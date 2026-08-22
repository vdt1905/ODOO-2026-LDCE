import { Stop, Trip, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildBudget, estimateTripCosts } from '../services/budget.service.js';
import { buildItinerary } from '../services/itinerary.service.js';

/**
 * Public pages are unauthenticated, so everything here goes through an explicit
 * allowlist rather than a blocklist: only the fields named below ever leave the
 * server. The owner's email, phone, bio and _id never appear.
 */
const publicOwner = (user) => ({
  firstName: user?.firstName || 'A traveller',
  avatarUrl: user?.avatarUrl || '',
});

const publicTripSummary = (trip, extra = {}) => ({
  name: trip.name,
  description: trip.description,
  startDate: trip.startDate,
  endDate: trip.endDate,
  coverPhotoUrl: trip.coverPhotoUrl,
  currency: trip.currency,
  publicSlug: trip.publicSlug,
  viewCount: trip.viewCount,
  createdAt: trip.createdAt,
  ...extra,
});

/**
 * GET /public/trips/:slug
 * Read-only itinerary + budget. Bumps viewCount as a side effect.
 */
export const getPublicTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ publicSlug: req.params.slug, isPublic: true }).populate(
    'user',
    'firstName avatarUrl'
  );

  if (!trip) throw ApiError.notFound('That itinerary is private or no longer exists');

  const [stops, activities] = await Promise.all([
    Stop.find({ trip: trip._id }).sort({ order: 1 }).populate('city').lean(),
    TripActivity.find({ trip: trip._id }).sort({ date: 1, order: 1 }).populate('activity').lean(),
  ]);

  const itinerary = buildItinerary({ trip, stops, activities });
  const budget = buildBudget({ trip, stops, activities });

  // Fire-and-forget: a failed counter must not fail the page.
  Trip.updateOne({ _id: trip._id }, { $inc: { viewCount: 1 } }).catch(() => {});

  return sendSuccess(res, {
    data: {
      // `tripId` is needed for "Copy Trip" — it is the only id exposed, and the
      // copy endpoint re-checks isPublic before cloning anything.
      tripId: String(trip._id),
      trip: publicTripSummary(trip, { status: trip.status }),
      owner: publicOwner(trip.user),
      stopCount: stops.length,
      activityCount: activities.length,
      days: itinerary.days,
      byCity: itinerary.byCity,
      budget: {
        currency: budget.currency,
        total: budget.total,
        avgPerDay: budget.avgPerDay,
        tripDays: budget.tripDays,
        byCategory: budget.byCategory,
        byStop: budget.byStop,
      },
    },
  });
});

/**
 * GET /public/trips?search=&sort=&page=
 * The community feed — every published itinerary.
 */
export const listPublicTrips = asyncHandler(async (req, res) => {
  const { search = '', sort = 'recent' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(36, Math.max(1, Number(req.query.limit) || 12));

  const SORTS = {
    recent: { createdAt: -1 },
    popular: { viewCount: -1 },
    name: { name: 1 },
  };

  const filter = { isPublic: true };
  if (search.trim()) filter.name = { $regex: search.trim(), $options: 'i' };

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .sort(SORTS[sort] || SORTS.recent)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'firstName avatarUrl')
      .lean(),
    Trip.countDocuments(filter),
  ]);

  // Same shared estimator as the trip list — the feed used to omit meals,
  // which understated every published trip.
  const costs = await estimateTripCosts(trips.map((trip) => trip._id));

  const items = trips.map((trip) => {
    const cost = costs.get(String(trip._id));
    return {
      ...publicTripSummary(trip),
      owner: publicOwner(trip.user),
      stopCount: cost.stopCount,
      activityCount: cost.activityCount,
      cities: cost.cities,
      countries: cost.countries,
      estimatedCost: cost.estimatedCost,
    };
  });

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1 },
  });
});
