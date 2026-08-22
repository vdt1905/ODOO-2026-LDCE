import { CalendarClock, Coins, MapPinned, PlaneTakeoff } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { relativeDayLabel } from '../../lib/dates.js';
import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';
import { Skeleton } from '../ui/Spinner.jsx';

/**
 * The dashboard's budget-highlight strip — "you have planned $4,320 across
 * 3 trips" broken into four tiles.
 *
 * Light cards on canvas rather than glass on the banner, so the numbers stay
 * readable wherever the illustration happens to be pale. The first tile is
 * inverted because the money figure is the one people come back for.
 *
 * The figure is deliberately the largest thing in its tile and set in Anton:
 * nobody reads a stat strip, they scan it for numbers, and the label only has
 * to say what the number they already spotted refers to.
 */
const Tile = ({ icon: Icon, label, value, sub, accent = false, wordy = false }) => (
  <div
    className={cn(
      'flex flex-col rounded-3xl border p-6 transition-colors duration-200',
      accent
        ? 'border-brand-500 bg-brand-500'
        : 'border-line bg-surface hover:border-line-strong hover:bg-inset'
    )}
  >
    <p
      className={cn(
        'flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase',
        accent ? 'text-brand-100' : 'text-ink-500'
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </p>

    <p
      className={cn(
        'mt-5 truncate font-display leading-none uppercase',
        // A phrase ("in 12 days") needs more room per character than a figure,
        // so it steps down rather than being truncated mid-word.
        wordy ? 'text-[clamp(1.6rem,2.6vw,2.25rem)]' : 'text-[clamp(2.25rem,4vw,3.25rem)]',
        accent ? 'text-white' : 'text-ink-900'
      )}
    >
      {value}
    </p>

    <p className={cn('mt-2.5 truncate text-xs', accent ? 'text-brand-100/85' : 'text-ink-500')}>
      {sub}
    </p>
  </div>
);

/** Same padding and rhythm as a real tile, so nothing shifts when data lands. */
const TileSkeleton = () => (
  <div className="rounded-3xl border border-line bg-surface p-6">
    <Skeleton className="h-3 w-24 rounded-full" />
    <Skeleton className="mt-5 h-11 w-32 rounded-lg" />
    <Skeleton className="mt-3 h-3 w-20 rounded-full" />
  </div>
);

export const BudgetHighlights = ({ stats, loading }) => (
  <section aria-label="Your planning at a glance" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {loading ? (
      Array.from({ length: 4 }, (_, i) => <TileSkeleton key={i} />)
    ) : (
      <>
        <Tile
          accent
          icon={Coins}
          label="Planned spend"
          // The server does not convert between currencies, so this is only a
          // true single-currency total; it takes its symbol from the next trip.
          value={formatCurrency(stats?.totalPlannedCost ?? 0, stats?.nextTrip?.currency, {
            compact: true,
          })}
          sub={`across ${pluralise(stats?.tripCount ?? 0, 'trip')}`}
        />
        <Tile
          icon={MapPinned}
          label="Cities"
          value={formatNumber(stats?.citiesPlanned ?? 0)}
          sub="on your itineraries"
        />
        <Tile
          icon={CalendarClock}
          label="Upcoming"
          value={formatNumber(stats?.byStatus?.upcoming ?? 0)}
          sub={
            stats?.byStatus?.ongoing
              ? `${pluralise(stats.byStatus.ongoing, 'trip')} on the road now`
              : 'trips ahead of you'
          }
        />
        <Tile
          wordy
          icon={PlaneTakeoff}
          label="Next departure"
          value={stats?.nextTrip ? relativeDayLabel(stats.nextTrip.startDate) : '—'}
          sub={stats?.nextTrip?.name || 'Nothing booked in'}
        />
      </>
    )}
  </section>
);
