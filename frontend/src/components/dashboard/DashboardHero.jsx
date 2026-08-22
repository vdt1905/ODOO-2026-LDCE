import { Plus, Search, Sparkles, Wand2 } from 'lucide-react';

import { BANNERS, ROUTES } from '../../lib/constants.js';
import { relativeDayLabel } from '../../lib/dates.js';
import { Button } from '../ui/Button.jsx';
import { PageHeader } from '../layout/PageHeader.jsx';

/**
 * The dashboard masthead. A thin arrangement of <PageHeader> rather than its
 * own thing — the photo has to sit behind the navbar exactly the way it does on
 * every other screen, and two header implementations would drift apart.
 *
 * The destination search rides inside the header via `children`; the budget
 * tiles deliberately stay below it, where they are on canvas and readable.
 */
export const DashboardHero = ({ user, stats, query, onQueryChange }) => (
  <PageHeader
    image={BANNERS.dashboard}
    size="lg"
    kicker={
      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-medium tracking-normal text-white normal-case backdrop-blur-md">
        <Sparkles className="size-3.5" aria-hidden />
        {stats?.nextTrip
          ? `${stats.nextTrip.name} starts ${relativeDayLabel(stats.nextTrip.startDate)}`
          : 'Nothing on the calendar yet'}
      </span>
    }
    title={`Welcome back, ${user?.firstName ?? 'traveller'}.`}
    sub="Pick up an itinerary where you left it, or start somewhere new."
    actions={
      <>
        <Button
          to={ROUTES.newTrip}
          variant="light"
          size="lg"
          leftIcon={<Plus className="size-4" />}
        >
          Plan a new trip
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
    {/* Filters the city rail further down the page. */}
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-ink-300"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search destinations — Kyoto, Portugal, somewhere warm…"
        aria-label="Search destinations"
        className="h-14 w-full rounded-full border border-white/30 bg-surface/95 pr-5 pl-13 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/25"
      />
    </div>
  </PageHeader>
);
