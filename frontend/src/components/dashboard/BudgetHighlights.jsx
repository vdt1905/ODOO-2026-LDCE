import { ArrowRight, CalendarClock, Coins, MapPinned } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { relativeDayLabel } from '../../lib/dates.js';
import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';

/**
 * The dashboard's budget-highlight strip — "you have planned $4,320 across
 * 3 trips" broken into four tiles.
 *
 * Light cards on canvas rather than glass on the banner, so the numbers stay
 * readable wherever the illustration happens to be pale. The first tile is
 * inverted because the money figure is the one people come back for.
 */
const Tile = ({ icon: Icon, label, value, sub, accent = false }) => (
  <div
    className={cn(
      'rounded-3xl border p-5 shadow-soft',
      accent ? 'border-ink-900 bg-ink-900' : 'border-line bg-surface'
    )}
  >
    <p
      className={cn(
        'flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase',
        accent ? 'text-canvas/65' : 'text-ink-500'
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </p>
    <p
      className={cn(
        'mt-2 truncate font-display text-2xl font-bold',
        accent ? 'text-canvas' : 'text-ink-900'
      )}
    >
      {value}
    </p>
    <p className={cn('mt-0.5 truncate text-xs', accent ? 'text-canvas/60' : 'text-ink-500')}>
      {sub}
    </p>
  </div>
);

const TileSkeleton = () => (
  <div className="h-[118px] animate-pulse rounded-3xl border border-line bg-canvas-deep" />
);

export const BudgetHighlights = ({ stats, loading }) => (
  <section aria-label="Budget highlights" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {loading ? (
      Array.from({ length: 4 }, (_, i) => <TileSkeleton key={i} />)
    ) : (
      <>
        <Tile
          accent
          icon={Coins}
          label="Planned spend"
          value={formatCurrency(stats?.plannedTotal ?? 0, stats?.currency, { compact: true })}
          sub={`across ${pluralise(stats?.tripCount ?? 0, 'trip')}`}
        />
        <Tile
          icon={MapPinned}
          label="Cities"
          value={formatNumber(stats?.cityCount ?? 0)}
          sub="on your itineraries"
        />
        <Tile
          icon={CalendarClock}
          label="Upcoming"
          value={formatNumber(stats?.upcomingCount ?? 0)}
          sub={
            stats?.ongoingCount
              ? `${pluralise(stats.ongoingCount, 'trip')} on the road now`
              : 'trips ahead of you'
          }
        />
        <Tile
          icon={ArrowRight}
          label="Next departure"
          value={stats?.nextTrip ? relativeDayLabel(stats.nextTrip.startDate) : '—'}
          sub={stats?.nextTrip?.name || 'Nothing booked in'}
        />
      </>
    )}
  </section>
);
