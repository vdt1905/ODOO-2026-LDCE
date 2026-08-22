import { differenceInDays, eachDayBetween, toDateKey } from '../utils/dates.js';

/**
 * Flattens the trip graph into one row per calendar day, ready to render as a
 * timeline or a calendar without any client-side date maths.
 *
 * Every day between startDate and endDate appears, including empty ones — the
 * UI renders those as "Free day" rather than collapsing the timeline, which is
 * what makes gaps in a plan visible.
 */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const activityName = (activity) =>
  activity.activity?.name || activity.customName || 'Untitled activity';

/**
 * Which stop a given day belongs to.
 * On a transition day (checkout from A, checkin to B) both stops match, so the
 * later arrival wins — that is the city the traveller actually ends the day in.
 */
const stopForDay = (stops, day) => {
  const key = toDateKey(day);
  const matches = stops.filter(
    (stop) => toDateKey(stop.startDate) <= key && key <= toDateKey(stop.endDate)
  );
  if (!matches.length) return null;

  return matches.reduce((latest, stop) =>
    toDateKey(stop.startDate) >= toDateKey(latest.startDate) ? stop : latest
  );
};

export const buildItinerary = ({ trip, stops, activities }) => {
  const byDate = new Map();
  activities.forEach((activity) => {
    const key = toDateKey(activity.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(activity);
  });

  const days = eachDayBetween(trip.startDate, trip.endDate).map((day, index) => {
    const key = toDateKey(day);
    const stop = stopForDay(stops, day);

    const dayActivities = (byDate.get(key) || [])
      .slice()
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '') || a.order - b.order)
      .map((activity) => ({
        _id: String(activity._id),
        name: activityName(activity),
        description: activity.activity?.description || '',
        imageUrl: activity.activity?.imageUrl || '',
        type: activity.activity?.type || 'custom',
        startTime: activity.startTime || '',
        durationMinutes: activity.durationMinutes,
        cost: round2(activity.cost),
        notes: activity.notes || '',
        stopId: String(activity.stop),
        order: activity.order,
      }));

    return {
      date: key,
      dayNumber: index + 1,
      isArrivalDay: stop ? toDateKey(stop.startDate) === key : false,
      isDepartureDay: stop ? toDateKey(stop.endDate) === key : false,
      stop: stop
        ? {
            _id: String(stop._id),
            city: stop.city?.name || 'Unknown city',
            country: stop.city?.country || '',
            order: stop.order,
          }
        : null,
      activities: dayActivities,
      subtotal: round2(dayActivities.reduce((sum, activity) => sum + activity.cost, 0)),
    };
  });

  // The same days regrouped by city, for the "grouped by city" view toggle.
  const byCity = stops.map((stop) => ({
    stopId: String(stop._id),
    order: stop.order,
    city: stop.city?.name || 'Unknown city',
    country: stop.city?.country || '',
    startDate: stop.startDate,
    endDate: stop.endDate,
    nights: Math.max(0, differenceInDays(stop.endDate, stop.startDate)),
    days: days.filter((day) => day.stop?._id === String(stop._id)),
  }));

  return {
    trip: {
      _id: String(trip._id),
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverPhotoUrl: trip.coverPhotoUrl,
      currency: trip.currency,
      budgetLimit: trip.budgetLimit ?? null,
      isPublic: trip.isPublic,
      publicSlug: trip.publicSlug || null,
      status: trip.status,
    },
    totalDays: days.length,
    stopCount: stops.length,
    activityCount: activities.length,
    days,
    byCity,
  };
};
