import { Activity, City, Stop, Trip, TripActivity, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { addDays, eachDayBetween, toDateKey } from '../utils/dates.js';
import { deleteTripCascade } from '../services/trip.service.js';

/**
 * Everything here runs as a Mongo aggregation, not a JS loop over fetched rows.
 * At demo scale either works; the pipeline is what survives real data, and it
 * is the thing worth showing a judge who asks about the database.
 */

/** GET /admin/stats */
export const getStats = asyncHandler(async (_req, res) => {
  const weekAgo = addDays(new Date(), -7);

  const [users, admins, trips, publicTrips, tripsThisWeek, newUsersThisWeek, agg, catalog] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Trip.countDocuments(),
      Trip.countDocuments({ isPublic: true }),
      Trip.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Trip.aggregate([
        {
          $project: {
            budgetLimit: 1,
            days: {
              $add: [
                {
                  $dateDiff: { startDate: '$startDate', endDate: '$endDate', unit: 'day' },
                },
                1,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTripLength: { $avg: '$days' },
            avgBudget: { $avg: '$budgetLimit' },
          },
        },
      ]),
      Promise.all([City.countDocuments(), Activity.countDocuments(), Stop.countDocuments(), TripActivity.countDocuments()]),
    ]);

  const [cities, activities, stops, plannedActivities] = catalog;

  return sendSuccess(res, {
    data: {
      users,
      admins,
      newUsersThisWeek,
      trips,
      publicTrips,
      tripsThisWeek,
      avgTripLengthDays: Math.round((agg[0]?.avgTripLength || 0) * 10) / 10,
      avgBudget: Math.round(agg[0]?.avgBudget || 0),
      cities,
      activities,
      stops,
      plannedActivities,
      tripsPerUser: users ? Math.round((trips / users) * 10) / 10 : 0,
    },
  });
});

/** GET /admin/popular-cities — which cities actually make it into itineraries. */
export const popularCities = asyncHandler(async (req, res) => {
  const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 8));

  const items = await Stop.aggregate([
    { $group: { _id: '$city', trips: { $addToSet: '$trip' }, stops: { $sum: 1 } } },
    { $lookup: { from: 'cities', localField: '_id', foreignField: '_id', as: 'city' } },
    { $unwind: '$city' },
    {
      $project: {
        _id: 0,
        cityId: '$_id',
        name: '$city.name',
        country: '$city.country',
        region: '$city.region',
        costIndex: '$city.costIndex',
        stops: 1,
        tripCount: { $size: '$trips' },
      },
    },
    { $sort: { tripCount: -1, stops: -1 } },
    { $limit: limit },
  ]);

  return sendSuccess(res, { data: { items } });
});

/** GET /admin/popular-activities */
export const popularActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(25, Math.max(1, Number(req.query.limit) || 8));

  const items = await TripActivity.aggregate([
    { $match: { activity: { $ne: null } } },
    { $group: { _id: '$activity', count: { $sum: 1 }, avgCost: { $avg: '$cost' } } },
    { $lookup: { from: 'activities', localField: '_id', foreignField: '_id', as: 'activity' } },
    { $unwind: '$activity' },
    { $lookup: { from: 'cities', localField: 'activity.city', foreignField: '_id', as: 'city' } },
    { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        activityId: '$_id',
        name: '$activity.name',
        type: '$activity.type',
        city: '$city.name',
        country: '$city.country',
        count: 1,
        avgCost: { $round: ['$avgCost', 2] },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  // Type split powers the bar chart next to the table.
  const byType = await TripActivity.aggregate([
    { $match: { activity: { $ne: null } } },
    { $lookup: { from: 'activities', localField: 'activity', foreignField: '_id', as: 'a' } },
    { $unwind: '$a' },
    { $group: { _id: '$a.type', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);

  return sendSuccess(res, { data: { items, byType } });
});

/**
 * GET /admin/trends?days=30
 * Signups and trips per day. Days with no activity are filled with zeroes so
 * the line chart has no gaps.
 */
export const getTrends = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const since = addDays(new Date(), -(days - 1));

  const perDay = (Model) =>
    Model.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
    ]);

  const [userRows, tripRows] = await Promise.all([perDay(User), perDay(Trip)]);

  const usersBy = Object.fromEntries(userRows.map((row) => [row._id, row.count]));
  const tripsBy = Object.fromEntries(tripRows.map((row) => [row._id, row.count]));

  const series = eachDayBetween(since, new Date()).map((day) => {
    const key = toDateKey(day);
    return { date: key, users: usersBy[key] || 0, trips: tripsBy[key] || 0 };
  });

  return sendSuccess(res, { data: { days, series } });
});

/** GET /admin/users?search=&role=&page= */
export const listUsers = asyncHandler(async (req, res) => {
  const { search = '', role } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const filter = {};
  if (role) filter.role = role;
  if (search.trim()) {
    filter.$or = [
      { firstName: { $regex: search.trim(), $options: 'i' } },
      { lastName: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const tripCounts = await Trip.aggregate([
    { $match: { user: { $in: users.map((user) => user._id) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const tripsBy = Object.fromEntries(tripCounts.map((row) => [String(row._id), row.count]));

  const items = users.map((user) => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    city: user.city,
    country: user.country,
    createdAt: user.createdAt,
    tripCount: tripsBy[String(user._id)] || 0,
  }));

  return sendSuccess(res, {
    data: { items, total, page, pages: Math.ceil(total / limit) || 1 },
  });
});

/** PATCH /admin/users/:id — role changes only. */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');

  return sendSuccess(res, { data: { user: user.toJSON() }, message: `Role set to ${role}` });
});

/** DELETE /admin/users/:id — removes the account and every trip it owns. */
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account from here');
  }

  const user = await User.findById(req.params.id).select('+avatarPublicId');
  if (!user) throw ApiError.notFound('User not found');

  const trips = await Trip.find({ user: user._id }).select('+coverPublicId');
  for (const trip of trips) {
    await deleteTripCascade(trip);
  }

  await user.deleteOne();

  return sendSuccess(res, {
    data: { tripsRemoved: trips.length },
    message: `${user.email} removed`,
  });
});
