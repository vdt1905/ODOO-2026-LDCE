/** Route paths in one place so no component hardcodes a URL string. */
export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  trips: '/trips',
  newTrip: '/trips/new',
  trip: (id) => `/trips/${id}`,
  tripBuilder: (id) => `/trips/${id}/build`,
  tripBudget: (id) => `/trips/${id}/budget`,
  cities: '/cities',
  activities: '/activities',
  community: '/community',
  profile: '/profile',
  admin: '/admin',
};

export const NAV_LINKS = [
  { label: 'Home', to: ROUTES.landing },
  { label: 'Destinations', to: ROUTES.cities },
  { label: 'Activities', to: ROUTES.activities },
  { label: 'Community', to: ROUTES.community },
];

/**
 * Deterministic gradient per city so cards look designed rather than random,
 * and never show a broken image while the catalog has no photos yet.
 * A city with `imageUrl` set in the DB always wins over this.
 */
export const CARD_GRADIENTS = [
  'from-clay-300 via-clay-400 to-clay-600',
  'from-moss-300 via-moss-500 to-moss-800',
  'from-dawn-300 via-clay-400 to-dusk-600',
  'from-dawn-100 via-dawn-500 to-clay-700',
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
  upcoming: { label: 'Upcoming', tone: 'clay', blurb: 'Packed and waiting.' },
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
