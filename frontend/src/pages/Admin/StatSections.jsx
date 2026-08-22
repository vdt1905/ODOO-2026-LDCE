import { Library, Route, Users } from 'lucide-react';

import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';
import { Alert } from '../../components/ui/index.js';

/**
 * adminApi.stats() returns thirteen flat counters. Thirteen identical tiles is
 * a wall of numbers nobody reads, so they are grouped by what they describe and
 * the pairs that only make sense together (users/admins, trips/public trips)
 * share a tile.
 */
const groupsFor = (stats) => [
  {
    key: 'people',
    title: 'People',
    icon: Users,
    tiles: [
      {
        label: 'Accounts',
        value: formatNumber(stats.users),
        sub: `${pluralise(stats.admins, 'admin')} among them`,
      },
      {
        label: 'New this week',
        value: formatNumber(stats.newUsersThisWeek),
        sub: 'signed up in the last 7 days',
      },
      {
        label: 'Trips per user',
        value: formatNumber(stats.tripsPerUser),
        sub: 'averaged across every account',
      },
    ],
  },
  {
    key: 'trips',
    title: 'Trips',
    icon: Route,
    tiles: [
      {
        label: 'Total',
        value: formatNumber(stats.trips),
        sub: `${formatNumber(stats.publicTrips)} shared publicly`,
      },
      {
        label: 'New this week',
        value: formatNumber(stats.tripsThisWeek),
        sub: 'created in the last 7 days',
      },
      {
        label: 'Average length',
        value: pluralise(stats.avgTripLengthDays, 'day'),
        sub: 'on the ground, start to end',
      },
      {
        label: 'Average budget',
        value: formatCurrency(stats.avgBudget, 'USD', { compact: true }),
        // The server averages budgetLimit across trips without converting, so
        // the figure is only meaningful as a rough order of magnitude.
        sub: 'unconverted — trips set their own currency',
      },
    ],
  },
  {
    key: 'catalog',
    title: 'Catalog',
    icon: Library,
    tiles: [
      { label: 'Cities', value: formatNumber(stats.cities), sub: 'in the seeded catalog' },
      { label: 'Activities', value: formatNumber(stats.activities), sub: 'available to add' },
      { label: 'Stops', value: formatNumber(stats.stops), sub: 'placed on itineraries' },
      {
        label: 'Planned activities',
        value: formatNumber(stats.plannedActivities),
        sub: 'scheduled across all trips',
      },
    ],
  },
];

const Tile = ({ label, value, sub }) => (
  <div className="rounded-3xl border border-line bg-surface p-5">
    <p className="text-[11px] font-medium tracking-wide text-ink-500 uppercase">{label}</p>
    <p className="mt-2 truncate font-display text-2xl text-ink-900">{value}</p>
    <p className="mt-0.5 text-xs leading-snug text-ink-500">{sub}</p>
  </div>
);

export const StatSections = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="space-y-8">
        {[3, 4, 4].map((count, index) => (
          <div key={index} className="space-y-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-canvas-deep" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: count }, (_, tile) => (
                <div key={tile} className="h-[110px] animate-pulse rounded-3xl bg-canvas-deep" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert tone="error" title="Platform stats could not be loaded">
        {error.message}
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {groupsFor(stats).map((group) => (
        <section key={group.key} aria-labelledby={`stats-${group.key}`}>
          <h2
            id={`stats-${group.key}`}
            className="eyebrow flex items-center gap-2 text-ink-500"
          >
            <group.icon className="size-3.5" aria-hidden />
            {group.title}
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.tiles.map((tile) => (
              <Tile key={tile.label} {...tile} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
