import { Coins, MapPinned, Route } from 'lucide-react';

import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';

const Tile = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-3xl border border-line bg-surface p-5">
    <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-ink-500 uppercase">
      <Icon className="size-3.5" aria-hidden />
      {label}
    </p>
    <p className="mt-2 truncate font-display text-2xl text-ink-900">{value}</p>
    <p className="mt-0.5 truncate text-xs text-ink-500">{sub}</p>
  </div>
);

/**
 * Totals from tripApi.summary via useTripStats.
 *
 * That hook treats a failure as a cosmetic loss and settles to `stats: null`
 * rather than surfacing an error, so there is no error branch to render here —
 * the tiles fall back to zero and the page below is unaffected.
 */
export const ProfileStats = ({ stats, loading }) => (
  <section aria-label="Your travel so far" className="grid gap-3 sm:grid-cols-3">
    {loading ? (
      Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-[118px] animate-pulse rounded-3xl bg-canvas-deep" />
      ))
    ) : (
      <>
        <Tile
          icon={Route}
          label="Trips"
          value={formatNumber(stats?.tripCount ?? 0)}
          sub={
            stats?.byStatus?.upcoming
              ? `${pluralise(stats.byStatus.upcoming, 'trip')} still ahead`
              : 'planned on your account'
          }
        />
        <Tile
          icon={MapPinned}
          label="Cities"
          value={formatNumber(stats?.citiesPlanned ?? 0)}
          sub="across every itinerary"
        />
        <Tile
          icon={Coins}
          label="Planned spend"
          value={formatCurrency(stats?.totalPlannedCost ?? 0, stats?.nextTrip?.currency, { compact: true })}
          sub="stops and activities combined"
        />
      </>
    )}
  </section>
);
