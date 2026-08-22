import { z } from 'zod';
import { Activity, City, REGIONS, Stop, Trip, TripActivity } from '../models/index.js';
import { ACTIVITY_TYPES } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { addDays, startOfUTCDay } from '../utils/dates.js';
import { generateStructured } from './llm.service.js';
import { buildTripPlannerPrompt, TRIP_RESPONSE_SCHEMA } from './prompts/tripPlanner.prompt.js';

/* --------------------------------------------------------------------------
   Step 2 — validate the model's JSON before anything touches Mongo.
   The schema the model is given constrains shape, not sanity: it can still
   return 0 nights or a 40-hour activity. Reject rather than write garbage.
   This is also the only gate on the Groq path, whose JSON mode guarantees the
   response parses but not that it matches the schema.
-------------------------------------------------------------------------- */
const aiActivitySchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600).optional().default(''),
  type: z.enum(ACTIVITY_TYPES).catch('sightseeing'),
  dayOffset: z.number().int().min(0).max(60),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .catch('09:00'),
  durationMinutes: z.number().int().min(15).max(720).catch(90),
  cost: z.number().min(0).max(100000).catch(0),
});

const aiStopSchema = z.object({
  cityName: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  region: z.enum(REGIONS).catch('Europe'),
  costIndex: z.number().int().min(1).max(100).catch(50),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  cityDescription: z.string().trim().max(600).optional().default(''),
  nights: z.number().int().min(1).max(60),
  transportCost: z.number().min(0).max(100000).catch(0),
  accommodationCost: z.number().min(0).max(500000).catch(0),
  mealBudgetPerDay: z.number().min(0).max(10000).catch(0),
  notes: z.string().trim().max(600).optional().default(''),
  activities: z.array(aiActivitySchema).max(40).default([]),
});

const aiTripSchema = z.object({
  tripName: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().default(''),
  currency: z.string().trim().length(3).toUpperCase().catch('USD'),
  stops: z.array(aiStopSchema).min(1, 'The planner returned no cities').max(12),
});

/* --------------------------------------------------------------------------
   Step 3 — reconcile nights.
   Models drift by a day or two. Adjusting the longest stop is invisible to the
   user; failing the request over arithmetic is not.
-------------------------------------------------------------------------- */
const reconcileNights = (stops, targetDays) => {
  const total = stops.reduce((sum, stop) => sum + stop.nights, 0);
  let delta = targetDays - total;
  if (delta === 0) return stops;

  const order = [...stops].sort((a, b) => b.nights - a.nights);

  while (delta !== 0) {
    let moved = false;

    for (const stop of order) {
      if (delta === 0) break;
      if (delta > 0) {
        stop.nights += 1;
        delta -= 1;
        moved = true;
      } else if (stop.nights > 1) {
        stop.nights -= 1;
        delta += 1;
        moved = true;
      }
    }

    // Every stop is already at the 1-night floor and we still owe days —
    // give the remainder to the first stop rather than spinning forever.
    if (!moved) {
      order[0].nights = Math.max(1, order[0].nights + delta);
      break;
    }
  }

  return stops;
};

/* --------------------------------------------------------------------------
   Step 4 — resolve each city: exact match → text search → create.
   The catalog grows itself, so a destination outside our 30 seeded cities
   still produces a real relational row rather than a loose string.
-------------------------------------------------------------------------- */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveCity = async (aiStop) => {
  const exact = await City.findOne({
    name: new RegExp(`^${escapeRegex(aiStop.cityName)}$`, 'i'),
  });
  if (exact) return exact;

  const fuzzy = await City.findOne({
    name: new RegExp(escapeRegex(aiStop.cityName), 'i'),
    country: new RegExp(escapeRegex(aiStop.country), 'i'),
  });
  if (fuzzy) return fuzzy;

  return City.create({
    name: aiStop.cityName,
    country: aiStop.country,
    region: aiStop.region,
    costIndex: aiStop.costIndex,
    // Unproven by real usage yet — starts below the seeded catalog.
    popularity: 45,
    description: aiStop.cityDescription,
    latitude: aiStop.latitude,
    longitude: aiStop.longitude,
  });
};

/* --------------------------------------------------------------------------
   Step 5 — upsert each activity into the catalog, then reference it.
   This keeps referential integrity AND organically enriches Activity Search:
   every AI trip makes the catalog better for the next manual planner.
-------------------------------------------------------------------------- */
const resolveActivity = async (aiActivity, cityId) => {
  const existing = await Activity.findOne({
    city: cityId,
    name: new RegExp(`^${escapeRegex(aiActivity.name)}$`, 'i'),
  });
  if (existing) return existing;

  return Activity.create({
    city: cityId,
    name: aiActivity.name,
    description: aiActivity.description,
    type: aiActivity.type,
    cost: aiActivity.cost,
    durationMinutes: aiActivity.durationMinutes,
    rating: 4.5,
  });
};

/**
 * Generates a complete, editable trip from a free-text brief.
 * Nothing about the result is read-only — it is a draft the user edits, which
 * is exactly why it is safe to demo.
 */
export const generateTrip = async ({ userId, input }) => {
  const { prompt, startDate, days, travelers, budgetLimit, currency, pace } = input;

  const maxStops = Math.max(1, Math.floor(days / 3));

  /* 1 — call */
  const raw = await generateStructured({
    systemPrompt: buildTripPlannerPrompt({
      days,
      pace,
      currency,
      budgetLimit,
      travelers,
      maxStops,
    }),
    userPrompt: `USER BRIEF: ${prompt}`,
    responseSchema: TRIP_RESPONSE_SCHEMA,
  });

  /* 2 — validate */
  const parsed = aiTripSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      502,
      'The trip planner returned something we could not use. Try rephrasing your brief.',
      parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }

  const plan = parsed.data;

  /* 3 — reconcile */
  reconcileNights(plan.stops, days);

  /* 4 + 5 — resolve cities and activities BEFORE writing the trip, so a
     failure here costs nothing to clean up. */
  const resolved = [];
  for (const aiStop of plan.stops) {
    const city = await resolveCity(aiStop);
    const activities = [];

    for (const aiActivity of aiStop.activities) {
      // Drop anything the model scheduled past the end of the stay.
      if (aiActivity.dayOffset >= aiStop.nights) continue;
      const catalogActivity = await resolveActivity(aiActivity, city._id);
      activities.push({ aiActivity, catalogActivity });
    }

    resolved.push({ aiStop, city, activities });
  }

  /* 6 — materialise. Dates are computed here, never taken from the model. */
  const tripStart = startOfUTCDay(startDate);
  const totalNights = resolved.reduce((sum, entry) => sum + entry.aiStop.nights, 0);

  const trip = await Trip.create({
    user: userId,
    name: plan.tripName,
    description: plan.description,
    startDate: tripStart,
    endDate: addDays(tripStart, totalNights),
    budgetLimit: budgetLimit ?? null,
    currency: plan.currency || currency,
  });

  try {
    let cursor = tripStart;
    let activityCount = 0;

    for (let index = 0; index < resolved.length; index += 1) {
      const { aiStop, city, activities } = resolved[index];

      const stopStart = cursor;
      const stopEnd = addDays(stopStart, aiStop.nights);
      cursor = stopEnd;

      const stop = await Stop.create({
        trip: trip._id,
        city: city._id,
        order: index,
        startDate: stopStart,
        endDate: stopEnd,
        notes: aiStop.notes,
        transportCost: aiStop.transportCost,
        accommodationCost: aiStop.accommodationCost,
        mealBudgetPerDay: aiStop.mealBudgetPerDay,
      });

      const rows = activities.map(({ aiActivity, catalogActivity }, order) => ({
        trip: trip._id,
        stop: stop._id,
        activity: catalogActivity._id,
        date: addDays(stopStart, aiActivity.dayOffset),
        startTime: aiActivity.startTime,
        durationMinutes: aiActivity.durationMinutes,
        cost: aiActivity.cost,
        notes: '',
        order,
      }));

      if (rows.length) {
        await TripActivity.insertMany(rows);
        activityCount += rows.length;
      }
    }

    return {
      tripId: String(trip._id),
      stopCount: resolved.length,
      activityCount,
    };
  } catch (error) {
    /* Failure behaviour — never leave a half-written trip behind. */
    await Promise.all([
      TripActivity.deleteMany({ trip: trip._id }),
      Stop.deleteMany({ trip: trip._id }),
    ]);
    await Trip.deleteOne({ _id: trip._id });

    console.error('[ai] materialisation failed, rolled back:', error.message);
    throw new ApiError(502, 'We could not save the generated trip. Please try again.');
  }
};
