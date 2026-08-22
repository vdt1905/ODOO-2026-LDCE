import { nightsBetween } from '../../lib/dates.js';

/**
 * The server's budget formula (backend/src/services/budget.service.js) run over
 * what is currently on screen.
 *
 * The builder is edit-heavy and every field is debounced, so `GET /budget` can
 * never keep up: the headline figure would sit one keystroke behind the box it
 * came from. Adding up locally is the only way the number moves with the input.
 *
 * Meals multiply by NIGHTS even though the field is called `mealBudgetPerDay` —
 * that is what the server does, and the two figures must not disagree.
 */
export const stopCost = (stop) => {
  const nights = nightsBetween(stop.startDate, stop.endDate);

  const transport = Number(stop.transportCost) || 0;
  const stay = Number(stop.accommodationCost) || 0;
  const meals = (Number(stop.mealBudgetPerDay) || 0) * nights;
  const activities = (stop.activities || []).reduce(
    (sum, entry) => sum + (Number(entry.cost) || 0),
    0
  );

  return {
    nights,
    transport,
    stay,
    meals,
    activities,
    total: transport + stay + meals + activities,
  };
};

export const tripCost = (stops = []) =>
  stops.reduce(
    (acc, stop) => {
      const cost = stopCost(stop);
      return {
        transport: acc.transport + cost.transport,
        stay: acc.stay + cost.stay,
        meals: acc.meals + cost.meals,
        activities: acc.activities + cost.activities,
        total: acc.total + cost.total,
        nights: acc.nights + cost.nights,
        activityCount: acc.activityCount + (stop.activities?.length || 0),
      };
    },
    { transport: 0, stay: 0, meals: 0, activities: 0, total: 0, nights: 0, activityCount: 0 }
  );
