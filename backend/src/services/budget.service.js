import { differenceInDays, eachDayBetween, toDateKey } from '../utils/dates.js';

/**
 * Every number the budget screen renders is computed here.
 * The client only draws — it never adds anything up, so the pie, the bars and
 * the sticky builder bar can never disagree with each other.
 *
 * Derived values (README §4 — none of these are stored):
 *   stop.nights        = endDate - startDate
 *   stop.activityTotal = Σ tripActivity.cost for that stop
 *   stop.mealTotal     = mealBudgetPerDay × nights
 *   trip.total         = Σ (transport + stay + meals + activities)
 *   trip.avgPerDay     = total / trip days
 */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

/** Category keys match the --color-cat-* tokens in the frontend theme. */
export const CATEGORIES = ['transport', 'stay', 'meals', 'activities'];

export const buildBudget = ({ trip, stops, activities }) => {
  const tripDays = differenceInDays(trip.endDate, trip.startDate) + 1;
  const tripNights = Math.max(0, tripDays - 1);

  // Group activity costs by stop in one pass.
  const activityCostByStop = new Map();
  activities.forEach((activity) => {
    const key = String(activity.stop);
    activityCostByStop.set(key, (activityCostByStop.get(key) || 0) + (activity.cost || 0));
  });

  const byStop = stops.map((stop) => {
    const nights = Math.max(0, differenceInDays(stop.endDate, stop.startDate));
    const transport = round2(stop.transportCost);
    const stay = round2(stop.accommodationCost);
    const meals = round2((stop.mealBudgetPerDay || 0) * nights);
    const activityTotal = round2(activityCostByStop.get(String(stop._id)) || 0);

    return {
      stopId: String(stop._id),
      order: stop.order,
      city: stop.city?.name || 'Unknown city',
      country: stop.city?.country || '',
      startDate: stop.startDate,
      endDate: stop.endDate,
      nights,
      transport,
      stay,
      meals,
      activities: activityTotal,
      total: round2(transport + stay + meals + activityTotal),
    };
  });

  const byCategory = byStop.reduce(
    (acc, stop) => ({
      transport: round2(acc.transport + stop.transport),
      stay: round2(acc.stay + stop.stay),
      meals: round2(acc.meals + stop.meals),
      activities: round2(acc.activities + stop.activities),
    }),
    { transport: 0, stay: 0, meals: 0, activities: 0 }
  );

  const total = round2(CATEGORIES.reduce((sum, key) => sum + byCategory[key], 0));

  /* ---------------------------------------------------------------------
     Daily spend.
     Activities land on their own date. Per-stop costs are spread across the
     nights of that stop so a single day never carries a whole hotel bill and
     falsely trips the overbudget alert.
  --------------------------------------------------------------------- */
  const daily = new Map(
    eachDayBetween(trip.startDate, trip.endDate).map((day) => [
      toDateKey(day),
      { date: toDateKey(day), transport: 0, stay: 0, meals: 0, activities: 0, total: 0 },
    ])
  );

  const bump = (key, category, amount) => {
    const row = daily.get(key);
    if (!row || !amount) return;
    row[category] = round2(row[category] + amount);
    row.total = round2(row.total + amount);
  };

  stops.forEach((stop) => {
    const nights = Math.max(0, differenceInDays(stop.endDate, stop.startDate));
    const days = eachDayBetween(stop.startDate, stop.endDate);
    const spread = nights || 1;

    // Transport is paid on arrival day; stay and meals spread across nights.
    bump(toDateKey(stop.startDate), 'transport', round2(stop.transportCost));

    days.slice(0, spread).forEach((day) => {
      bump(toDateKey(day), 'stay', round2((stop.accommodationCost || 0) / spread));
      bump(toDateKey(day), 'meals', round2(stop.mealBudgetPerDay));
    });
  });

  activities.forEach((activity) => {
    bump(toDateKey(activity.date), 'activities', round2(activity.cost));
  });

  // A day is flagged when it exceeds the even daily share of the budget limit.
  const dailyAllowance = trip.budgetLimit ? round2(trip.budgetLimit / Math.max(1, tripDays)) : null;

  const dailySpend = [...daily.values()].map((row) => ({
    ...row,
    isOverBudget: dailyAllowance !== null && row.total > dailyAllowance,
  }));

  const mostExpensiveStop = byStop.reduce(
    (worst, stop) => (!worst || stop.total > worst.total ? stop : worst),
    null
  );

  return {
    currency: trip.currency,
    budgetLimit: trip.budgetLimit ?? null,
    dailyAllowance,

    total,
    avgPerDay: round2(total / Math.max(1, tripDays)),
    tripDays,
    tripNights,

    byCategory,
    byStop,
    dailySpend,

    mostExpensiveStop: mostExpensiveStop
      ? { city: mostExpensiveStop.city, total: mostExpensiveStop.total }
      : null,

    remaining: trip.budgetLimit ? round2(trip.budgetLimit - total) : null,
    isOverBudget: Boolean(trip.budgetLimit && total > trip.budgetLimit),
    overBudgetDays: dailySpend.filter((day) => day.isOverBudget).map((day) => day.date),
  };
};
