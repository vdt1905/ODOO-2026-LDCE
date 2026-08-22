/** Route paths in one place so no component hardcodes a URL string. */
export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  trips: '/trips',
  newTrip: '/trips/new',
  /** Static, so React Router ranks it above /trips/:id without extra config. */
  aiTrip: '/trips/ai',
  trip: (id) => `/trips/${id}`,
  tripBuilder: (id) => `/trips/${id}/build`,
  tripBudget: (id) => `/trips/${id}/budget`,
  cities: '/cities',
  activities: '/activities',
  community: '/community',
  profile: '/profile',
  admin: '/admin',
  /** Public share links are short on purpose — they get pasted into chats. */
  publicTrip: (slug) => `/t/${slug}`,
};

export const NAV_LINKS = [
  { label: 'Home', to: ROUTES.landing },
  { label: 'Destinations', to: ROUTES.cities },
  { label: 'Activities', to: ROUTES.activities },
  { label: 'Community', to: ROUTES.community },
];

/**
 * Masthead photography, one per screen.
 *
 * These sit BEHIND the navbar (see components/layout/PageHeader.jsx), so each
 * one is requested at 1800px wide and picked for a quiet upper third — the nav
 * has to stay readable across the top of it. `q=70` keeps them under ~150KB;
 * they are decorative and never the thing the user came to read.
 */
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=70`;

export const BANNERS = {
  dashboard: unsplash('1469854523086-cc02fe5d8800'),
  trips: unsplash('1501785888041-af3ef285b470'),
  newTrip: unsplash('1488646953014-85cb44e25828'),
  trip: unsplash('1476514525535-07fb3b4ae5f1'),
  aiTrip: unsplash('1502680390469-be75c86b636f'),
  builder: unsplash('1507525428034-b723cf961d3e'),
  budget: unsplash('1518432031352-d6fc5c10da5a'),
  cities: unsplash('1493246507139-91e8fad9978e'),
  activities: unsplash('1533105079780-92b9be482077'),
  community: unsplash('1519681393784-d120267933ba'),
  profile: unsplash('1464822759023-fed622ff2c3b'),
  admin: unsplash('1451187580459-43490279c0fa'),
  publicTrip: unsplash('1502920917128-1aa500764cbd'),
};

/**
 * Deterministic gradient per city so cards look designed rather than random,
 * and never show a broken image while the catalog has no photos yet.
 * A city with `imageUrl` set in the DB always wins over this.
 */
export const CARD_GRADIENTS = [
  'from-brand-300 via-brand-400 to-brand-600',
  'from-moss-300 via-moss-500 to-moss-800',
  'from-dawn-300 via-brand-400 to-dusk-600',
  'from-dawn-100 via-dawn-500 to-brand-700',
  'from-moss-100 via-moss-300 to-moss-600',
  'from-dusk-400 via-dusk-600 to-ink-700',
];

export const gradientFor = (seed = '') => {
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
};

/** Shown when the API is unreachable, so the landing page is never empty. */
export const FALLBACK_CITIES = [
  { _id: 'f1', name: 'Santorini', country: 'Greece', region: 'Europe', costIndex: 72, popularity: 90 },
  { _id: 'f2', name: 'Kyoto', country: 'Japan', region: 'Asia', costIndex: 66, popularity: 91 },
  { _id: 'f3', name: 'Bali', country: 'Indonesia', region: 'Asia', costIndex: 34, popularity: 95 },
  { _id: 'f4', name: 'Cape Town', country: 'South Africa', region: 'Africa', costIndex: 44, popularity: 89 },
  { _id: 'f5', name: 'Lisbon', country: 'Portugal', region: 'Europe', costIndex: 52, popularity: 86 },
  { _id: 'f6', name: 'Queenstown', country: 'New Zealand', region: 'Oceania', costIndex: 76, popularity: 82 },
];

/* -------------------------------------------------------------------------
   Trip list controls — shared by the dashboard and, later, the My Trips
   screen. `value` is exactly what the API expects, so a control can be wired
   straight to a query param with no translation layer in between.
------------------------------------------------------------------------- */

/** Sent as ?status= / ?visibility=. */
export const TRIP_FILTERS = [
  { value: 'all', label: 'All trips' },
  { value: 'ongoing', label: 'On the road' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Past trips' },
  { value: 'public', label: 'Shared publicly' },
];

/** Sent as ?sort=. */
export const TRIP_SORTS = [
  { value: 'soonest', label: 'Date · soonest' },
  { value: 'latest', label: 'Date · latest' },
  { value: 'recent', label: 'Recently added' },
  { value: 'name', label: 'Name · A to Z' },
];

/** Purely presentational, so grouping happens on the client. */
export const TRIP_GROUPS = [
  { value: 'status', label: 'Status' },
  { value: 'month', label: 'Departure month' },
  { value: 'none', label: 'Nothing' },
];

/** Order and copy for the status headings, plus the badge tone each one uses. */
export const TRIP_STATUS_META = {
  ongoing: { label: 'On the road', tone: 'moss', blurb: 'Happening right now.' },
  upcoming: { label: 'Upcoming', tone: 'brand', blurb: 'Packed and waiting.' },
  completed: { label: 'Past trips', tone: 'neutral', blurb: 'Been there.' },
};

export const TRIP_STATUS_ORDER = ['ongoing', 'upcoming', 'completed'];

/** Matches City.REGIONS on the server. */
export const REGIONS = [
  'Europe',
  'Asia',
  'North America',
  'South America',
  'Africa',
  'Oceania',
];

/** Currencies offered on the Create Trip form. One base currency per trip. */
export const CURRENCIES = [
  { value: 'USD', label: 'USD · US dollar' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'GBP', label: 'GBP · Pound sterling' },
  { value: 'INR', label: 'INR · Indian rupee' },
  { value: 'JPY', label: 'JPY · Japanese yen' },
  { value: 'AUD', label: 'AUD · Australian dollar' },
];

/** Cap enforced by the API's createTripSchema — mirrored for instant feedback. */
export const MAX_SEED_CITIES = 12;

/* -------------------------------------------------------------------------
   Activities
------------------------------------------------------------------------- */

/**
 * Mirrors ACTIVITY_TYPES in the server's Activity model. `custom` is not in
 * that enum — the itinerary service stamps it on free-text entries that have
 * no catalog row behind them, so it needs a label and a colour here too.
 */
export const ACTIVITY_TYPES = [
  { value: 'sightseeing', label: 'Sightseeing', emoji: '🏛' },
  { value: 'food', label: 'Food & drink', emoji: '🍽' },
  { value: 'adventure', label: 'Adventure', emoji: '🥾' },
  { value: 'culture', label: 'Culture', emoji: '🎭' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🌿' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍' },
  { value: 'custom', label: 'Custom', emoji: '✳️' },
];

export const ACTIVITY_TYPE_META = Object.fromEntries(
  ACTIVITY_TYPES.map((type) => [type.value, type])
);

export const ACTIVITY_SORTS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'cost-asc', label: 'Cheapest first' },
  { value: 'cost-desc', label: 'Priciest first' },
  { value: 'duration', label: 'Quickest first' },
  { value: 'name', label: 'Name · A to Z' },
];

export const CITY_SORTS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'cost-asc', label: 'Cheapest first' },
  { value: 'cost-desc', label: 'Priciest first' },
  { value: 'name', label: 'Name · A to Z' },
];

export const COMMUNITY_SORTS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'popular', label: 'Most viewed' },
  { value: 'name', label: 'Name · A to Z' },
];

/* -------------------------------------------------------------------------
   Budget
------------------------------------------------------------------------- */

/** Order and colour for every chart, legend and chip. Matches the API's CATEGORIES. */
export const BUDGET_CATEGORIES = [
  { value: 'transport', label: 'Transport', color: 'var(--color-cat-transport)' },
  { value: 'stay', label: 'Stay', color: 'var(--color-cat-stay)' },
  { value: 'meals', label: 'Meals', color: 'var(--color-cat-meals)' },
  { value: 'activities', label: 'Activities', color: 'var(--color-cat-activities)' },
];

/* -------------------------------------------------------------------------
   AI trip generator
------------------------------------------------------------------------- */

export const AI_PACES = [
  { value: 'relaxed', label: 'Relaxed', blurb: 'One or two things a day, long lunches.' },
  { value: 'balanced', label: 'Balanced', blurb: 'A full day out, an evening free.' },
  { value: 'packed', label: 'Packed', blurb: 'See everything. Sleep on the plane home.' },
];

/** Hard ceiling in the server's generateTripSchema — longer briefs time out. */
export const AI_MAX_DAYS = 21;

export const AI_EXAMPLE_PROMPTS = [
  'Ten relaxed days in Japan for two, focused on food and temples.',
  'A fortnight through Portugal and Spain by train, mid-range budget.',
  'One week in Iceland in winter — northern lights and hot springs.',
  'Two weeks backpacking Vietnam, street food and beaches, cheap as possible.',
];
