import { City, Stop, TripActivity } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { addUtcDays, nightsBetween } from '../utils/dates.js';

/**
 * How a city's 1–100 cost index becomes an opening budget guess.
 *
 * These are starting numbers the traveller edits in the builder, not claims
 * about real prices — their job is to make the budget screen meaningful the
 * moment a trip is created instead of showing four zeroes. Keep them boring
 * and linear so the relationship stays explainable during judging.
 */
export const COST_MODEL = {
  /** Nightly room rate ≈ index × 1.6 → Paris (78) ≈ $125/night. */
  nightlyRate: (costIndex) => Math.round(costIndex * 1.6),
  /** Daily food budget ≈ index × 0.7 → Paris (78) ≈ $55/day. */
  mealsPerDay: (costIndex) => Math.round(costIndex * 0.7),
  /** A regional hop into the city. The first stop is where you already are. */
  hop: (costIndex, isFirst) => (isFirst ? 0 : Math.round(60 + costIndex * 0.8)),
};

/**
 * Splits `nights` as evenly as possible across `count` stops, giving the
 * remainder to the earliest ones — 11 nights over 3 cities → [4, 4, 3].
 */
const splitNights = (nights, count) => {
  if (count <= 0) return [];
  const base = Math.floor(nights / count);
  const extra = nights % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
};

/**
 * Turns the cities ticked on the Create Trip screen into real Stop rows.
 *
 * Consecutive stops deliberately share their boundary day (you arrive in Rome
 * on the day you leave Paris), which is how multi-city travel actually works
 * and keeps the day-wise itinerary contiguous with no unassigned gaps.
 *
 * Returns the created stops, or [] when no cities were picked.
 */
export const seedStopsFromCities = async (trip, cityIds = []) => {
  // De-duplicate but keep the order the user picked them in — that order is
  // the itinerary, and stop.order is what the builder drags around later.
  const uniqueIds = [...new Set(cityIds.map(String))];
  if (uniqueIds.length === 0) return [];

  const cities = await City.find({ _id: { $in: uniqueIds } }).lean();
  const byId = new Map(cities.map((city) => [String(city._id), city]));

  const missing = uniqueIds.filter((id) => !byId.has(id));
  if (missing.length) {
    throw ApiError.badRequest(
      'One of the selected cities is no longer in the catalog. Refresh and try again.'
    );
  }

  const totalNights = nightsBetween(trip.startDate, trip.endDate);
  const perStop = splitNights(totalNights, uniqueIds.length);

  let cursor = trip.startDate;
  const docs = uniqueIds.map((id, index) => {
    const city = byId.get(id);
    const nights = perStop[index];
    const startDate = cursor;
    const endDate = addUtcDays(startDate, nights);
    cursor = endDate;

    return {
      trip: trip._id,
      city: city._id,
      order: index,
      startDate,
      endDate,
      transportCost: COST_MODEL.hop(city.costIndex, index === 0),
      accommodationCost: COST_MODEL.nightlyRate(city.costIndex) * nights,
      mealBudgetPerDay: COST_MODEL.mealsPerDay(city.costIndex),
    };
  });

  return Stop.insertMany(docs);
};

/**
 * Per-trip rollups for the dashboard and My Trips cards: how many cities, which
 * ones, and roughly what it all costs.
 *
 * Two aggregations for the whole page rather than N queries per card. This is
 * the *summary* only — the full per-day, per-category breakdown behind
 * `GET /trips/:id/budget` belongs in budget.service.js.
 */
export const summariseTrips = async (tripIds) => {
  const summaries = new Map();
  if (!tripIds.length) return summaries;

  const [stopRows, activityRows] = await Promise.all([
    Stop.aggregate([
      { $match: { trip: { $in: tripIds } } },
      {
        $addFields: {
          // Portable day maths — avoids $dateDiff so an older local Mongo works.
          nights: {
            $max: [
              0,
              {
                $floor: {
                  $divide: [{ $subtract: ['$endDate', '$startDate'] }, 86400000],
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'cityDoc',
        },
      },
      { $unwind: { path: '$cityDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$trip',
          stopCount: { $sum: 1 },
          nights: { $sum: '$nights' },
          transportTotal: { $sum: '$transportCost' },
          stayTotal: { $sum: '$accommodationCost' },
          mealTotal: { $sum: { $multiply: ['$mealBudgetPerDay', '$nights'] } },
          // { name, order } so the JS sort below is not relying on $group
          // preserving document order, which Mongo does not promise.
          cities: { $push: { name: '$cityDoc.name', order: '$order' } },
        },
      },
    ]),
    TripActivity.aggregate([
      { $match: { trip: { $in: tripIds } } },
      { $group: { _id: '$trip', activityTotal: { $sum: '$cost' }, activityCount: { $sum: 1 } } },
    ]),
  ]);

  const activityById = new Map(activityRows.map((row) => [String(row._id), row]));

  for (const row of stopRows) {
    const key = String(row._id);
    const activity = activityById.get(key);
    const activityTotal = activity?.activityTotal ?? 0;

    summaries.set(key, {
      stopCount: row.stopCount,
      nights: row.nights,
      activityCount: activity?.activityCount ?? 0,
      cityNames: [...row.cities]
        .sort((a, b) => a.order - b.order)
        .map((city) => city.name)
        .filter(Boolean),
      estimatedTotal:
        row.transportTotal + row.stayTotal + row.mealTotal + activityTotal,
      breakdown: {
        transport: row.transportTotal,
        stay: row.stayTotal,
        meals: row.mealTotal,
        activities: activityTotal,
      },
    });
  }

  // A trip with activities but no stops cannot happen, but a trip with neither
  // is the normal state right after creation — callers get a zeroed summary.
  return summaries;
};

/** Shape sent to the client: the trip document plus its rollup. */
export const withSummary = (trip, summaries) => {
  const summary = summaries.get(String(trip._id));

  return {
    ...trip.toJSON(),
    stopCount: summary?.stopCount ?? 0,
    nights: summary?.nights ?? 0,
    activityCount: summary?.activityCount ?? 0,
    cityNames: summary?.cityNames ?? [],
    estimatedTotal: summary?.estimatedTotal ?? 0,
    breakdown: summary?.breakdown ?? { transport: 0, stay: 0, meals: 0, activities: 0 },
  };
};
