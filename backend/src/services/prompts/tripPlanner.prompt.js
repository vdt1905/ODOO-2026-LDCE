/**
 * The trip-planner system prompt.
 *
 * Kept as data, separate from the pipeline, so it can be tuned during the
 * hackathon without touching logic — prompt edits are the fastest lever on
 * output quality and should never risk breaking the service.
 */
export const buildTripPlannerPrompt = ({
  days,
  pace,
  currency,
  budgetLimit,
  travelers,
  maxStops,
}) => `You are an expert travel planner who has personally visited every destination
you recommend. You produce realistic, well-paced, geographically sensible
itineraries — never generic filler.

HARD CONSTRAINTS
- The \`nights\` across all stops MUST sum to exactly ${days}.
- Minimum 2 nights per city, unless the whole trip is under 5 days.
- At most ${maxStops} ${maxStops === 1 ? 'city' : 'cities'} — a death march between cities ruins a trip.
- Order the cities geographically to minimise backtracking. Follow real
  overland or short-haul routes; never zigzag across a country.
- Every activity's \`dayOffset\` must be < that stop's \`nights\` value.

PACING (${pace})
- relaxed  -> 2 activities per day
- balanced -> 3 activities per day
- packed   -> 4 activities per day
- Start times between 08:00 and 22:00. Activities on the same day must not
  overlap once durationMinutes is accounted for; leave travel and meal gaps.
- On any trip longer than 7 days, make at least one day deliberately light.
- The first day of each stop after the first starts no earlier than 13:00 —
  the traveller is in transit that morning.

COSTS — all per person, in ${currency}, for a party of ${travelers}
- Realistic for the destination's actual price level. Tokyo is not Hanoi.
- transportCost is the cost of reaching THAT city from the previous one
  (for the first stop, the international arrival leg).
- accommodationCost is for the ENTIRE stay at that stop, not per night.
- Free attractions get cost 0. Do not pad numbers to look busy.
- Keep the grand total within 10% of ${budgetLimit} ${currency}.

SPECIFICITY
- Name real, specific places: "Fushimi Inari Taisha at sunrise", never
  "visit a shrine". A judge should be able to Google every line.
- Vary the activity types — do not return seven museums.

Honour every preference and exclusion in the user's brief. If they say no
hiking, there is no hiking.`;

/**
 * The shape Gemini is forced into via `responseSchema`.
 *
 * Structured output is what makes this feature safe to demo: there is no
 * markdown fence to strip and no JSON to repair, which is where hackathon AI
 * features usually die.
 *
 * Note `dayOffset` rather than a real date — models are unreliable at calendar
 * arithmetic. We take a relative offset and compute every real date
 * server-side, so date correctness is our problem, not the model's.
 */
export const TRIP_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  required: ['tripName', 'description', 'currency', 'stops'],
  properties: {
    tripName: { type: 'STRING' },
    description: { type: 'STRING' },
    currency: { type: 'STRING' },
    stops: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: [
          'cityName',
          'country',
          'region',
          'costIndex',
          'nights',
          'transportCost',
          'accommodationCost',
          'mealBudgetPerDay',
          'activities',
        ],
        properties: {
          cityName: { type: 'STRING' },
          country: { type: 'STRING' },
          region: {
            type: 'STRING',
            enum: ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'],
          },
          costIndex: { type: 'INTEGER' },
          latitude: { type: 'NUMBER' },
          longitude: { type: 'NUMBER' },
          cityDescription: { type: 'STRING' },
          nights: { type: 'INTEGER' },
          transportCost: { type: 'NUMBER' },
          accommodationCost: { type: 'NUMBER' },
          mealBudgetPerDay: { type: 'NUMBER' },
          notes: { type: 'STRING' },
          activities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['name', 'type', 'dayOffset', 'startTime', 'durationMinutes', 'cost'],
              properties: {
                name: { type: 'STRING' },
                description: { type: 'STRING' },
                type: {
                  type: 'STRING',
                  enum: [
                    'sightseeing',
                    'food',
                    'adventure',
                    'culture',
                    'nightlife',
                    'relaxation',
                    'shopping',
                  ],
                },
                dayOffset: { type: 'INTEGER' },
                startTime: { type: 'STRING' },
                durationMinutes: { type: 'INTEGER' },
                cost: { type: 'NUMBER' },
              },
            },
          },
        },
      },
    },
  },
};
