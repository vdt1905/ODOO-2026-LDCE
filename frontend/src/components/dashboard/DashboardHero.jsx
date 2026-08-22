import { CalendarCheck2, Plus, Search, Wand2 } from 'lucide-react';

import { BANNERS, ROUTES } from '../../lib/constants.js';
import { daysUntil, formatDate } from '../../lib/dates.js';
import { Button } from '../ui/Button.jsx';
import { PageHeader } from '../layout/PageHeader.jsx';

/**
 * The dashboard masthead. A thin arrangement of <PageHeader> rather than its
 * own thing — the photo has to sit behind the navbar exactly the way it does on
 * every other screen, and two header implementations would drift apart.
 *
 * It answers the three questions a returning user has, in the order they ask
 * them: who am I (the greeting), what is next (the countdown), what now (the
 * two actions). The destination search rides inside the header via `children`;
 * the budget tiles deliberately stay below it, where they are on canvas and
 * readable.
 */

/** Local clock, not UTC — this greets the person at their own desk. */
const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const todayLabel = (date = new Date()) =>
  date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * The countdown reduced to one big figure and one word under it, because that
 * pair is what people actually read. Anything already under way says so in
 * words rather than showing a negative number.
 */
const countdown = (startDate) => {
  const days = daysUntil(startDate);
  if (days > 1) return { figure: String(days), unit: 'days to go' };
  if (days === 1) return { figure: '1', unit: 'day to go' };
  if (days === 0) return { figure: 'Today', unit: 'you leave' };
  return { figure: 'Now', unit: 'under way' };
};

/** Shared shell so the three states below cannot drift apart in size. */
const Callout = ({ children }) => (
  <div className="flex min-h-23 w-full items-center gap-4 rounded-3xl border border-white/25 bg-black/30 p-4 backdrop-blur-md sm:w-auto sm:min-w-75">
    {children}
  </div>
);

const NextTripCallout = ({ nextTrip, pending }) => {
  if (pending) {
    return (
      <Callout>
        <div className="size-12 animate-pulse rounded-2xl bg-white/20" aria-hidden />
        <div className="flex-1 space-y-2" aria-hidden>
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/20" />
          <div className="h-3.5 w-36 animate-pulse rounded-full bg-white/20" />
        </div>
        <span className="sr-only">Loading your next trip</span>
      </Callout>
    );
  }

  if (!nextTrip) {
    return (
      <Callout>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/10 text-white">
          <CalendarCheck2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-white/65">Next departure</p>
          <p className="mt-1 font-display text-lg leading-none text-white uppercase">
            Nothing booked in
          </p>
          <p className="mt-1.5 text-xs text-white/70">Plan a trip and it lands here.</p>
        </div>
      </Callout>
    );
  }

  const { figure, unit } = countdown(nextTrip.startDate);

  return (
    <Callout>
      <div className="grid min-w-16 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/10 px-2 py-2 text-center">
        <span className="font-display text-3xl leading-none text-white uppercase">{figure}</span>
      </div>
      <div className="min-w-0">
        <p className="eyebrow text-white/65">Next departure · {unit}</p>
        <p className="mt-1 truncate font-display text-lg leading-none text-white uppercase">
          {nextTrip.name}
        </p>
        <p className="mt-1.5 truncate text-xs text-white/70">
          Leaves {formatDate(nextTrip.startDate, { long: true })}
        </p>
      </div>
    </Callout>
  );
};

export const DashboardHero = ({ user, stats, query, onQueryChange }) => (
  <PageHeader
    image={BANNERS.dashboard}
    size="lg"
    kicker={todayLabel()}
    title={`${greetingFor()}, ${user?.firstName?.trim() || 'traveller'}.`}
    sub="Everything you have planned is below — pick up an itinerary where you left it, or start somewhere new."
    actions={
      <>
        <Button
          to={ROUTES.newTrip}
          variant="light"
          size="lg"
          leftIcon={<Plus className="size-4" />}
        >
          Plan a trip
        </Button>
        {/* Glass rather than light, so the hand-built route stays the obvious
            default and this reads as the alternative it is. */}
        <Button
          to={ROUTES.aiTrip}
          variant="glass"
          size="lg"
          leftIcon={<Wand2 className="size-4" />}
        >
          Plan with AI
        </Button>
      </>
    }
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <NextTripCallout nextTrip={stats?.nextTrip} pending={!stats} />

      {/* Filters the city rail further down the page. */}
      <div className="min-w-0 flex-1">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Where are you going? Kyoto, Portugal, somewhere warm…"
            aria-label="Search destinations"
            className="h-14 w-full rounded-full border border-white/40 bg-surface/95 pr-5 pl-13 text-sm text-ink-900 shadow-pill transition-colors outline-none placeholder:text-ink-300 hover:border-white focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/25"
          />
        </div>
        <p className="mt-2 pl-5 text-xs text-white/70">
          Matching cities appear further down the page as you type.
        </p>
      </div>
    </div>
  </PageHeader>
);
