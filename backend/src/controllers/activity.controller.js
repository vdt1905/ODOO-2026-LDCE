import { Activity, ACTIVITY_TYPES } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const SORTS = {
  rating: { rating: -1 },
  'cost-asc': { cost: 1 },
  'cost-desc': { cost: -1 },
  duration: { durationMinutes: 1 },
  name: { name: 1 },
};

/**
 * GET /activities?city=&type=&maxCost=&maxDuration=&search=&sort=&page=&limit=
 *
 * Feeds both the standalone Activity Search screen and the builder's activity
 * drawer (which passes ?city= to scope the catalog to one stop).
 */
export const listActivities = asyncHandler(async (req, res) => {
  const { city, type, search = '', sort = 'rating' } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

  const filter = {};
  if (city) filter.city = city;
  if (type) filter.type = type;
  if (search.trim()) filter.name = { $regex: search.trim(), $options: 'i' };

  const maxCost = Number(req.query.maxCost);
  if (Number.isFinite(maxCost)) filter.cost = { $lte: maxCost };

  const maxDuration = Number(req.query.maxDuration);
  if (Number.isFinite(maxDuration)) filter.durationMinutes = { $lte: maxDuration };

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .sort(SORTS[sort] || SORTS.rating)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('city', 'name country region')
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1, types: ACTIVITY_TYPES },
  });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id).populate('city', 'name country').lean();
  if (!activity) throw ApiError.notFound('Activity not found');

  return sendSuccess(res, { data: { activity } });
});

/** GET /activities/meta — filter options for the search UI. */
export const activityMeta = asyncHandler(async (_req, res) => {
  const [range] = await Activity.aggregate([
    {
      $group: {
        _id: null,
        maxCost: { $max: '$cost' },
        maxDuration: { $max: '$durationMinutes' },
        total: { $sum: 1 },
      },
    },
  ]);

  return sendSuccess(res, {
    data: {
      types: ACTIVITY_TYPES,
      maxCost: Math.ceil(range?.maxCost || 0),
      maxDuration: Math.ceil(range?.maxDuration || 0),
      total: range?.total || 0,
    },
  });
});
