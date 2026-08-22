import { Plus, Search, Sparkles } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { relativeDayLabel } from '../../lib/dates.js';
import { Button } from '../ui/Button.jsx';
import { HeroScene } from '../landing/HeroScene.jsx';

/**
 * The "Banner Image" band from the dashboard mockup: welcome message, the
 * primary action, and the destination search.
 *
 * Full-bleed and dark on purpose — the navbar floats transparently over `/`
 * until you scroll, and needs something dark underneath to stay legible. The
 * budget tiles deliberately live *below* this band rather than on it: the
 * scene fades to canvas at its foot, and white-on-cream is not readable.
 */
export const DashboardHero = ({ user, stats, query, onQueryChange }) => (
  <section className="relative isolate overflow-hidden px-4 pt-28 pb-16 sm:px-6">
    <div className="absolute inset-0 -z-10">
      <HeroScene />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_40%,rgba(23,20,15,0.62),rgba(23,20,15,0.34)_70%,rgba(23,20,15,0.22))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/45 via-transparent to-canvas" />
    </div>

    <div className="mx-auto max-w-6xl">
      <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
        <Sparkles className="size-3.5" aria-hidden />
        {stats?.nextTrip
          ? `${stats.nextTrip.name} starts ${relativeDayLabel(stats.nextTrip.startDate)}`
          : 'Nothing on the calendar yet'}
      </span>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="delay-1 animate-fade-up font-display text-4xl leading-tight font-extrabold text-white drop-shadow-[0_2px_18px_rgba(23,20,15,0.45)] sm:text-5xl">
            Welcome back, {user?.firstName}.
          </h1>
          <p className="delay-2 mt-2 max-w-lg animate-fade-up text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_10px_rgba(23,20,15,0.4)] sm:text-base">
            Pick up an itinerary where you left it, or start somewhere new.
          </p>
        </div>

        <Button
          to={ROUTES.newTrip}
          variant="light"
          size="lg"
          className="delay-2 animate-fade-up"
          leftIcon={<Plus className="size-4" />}
        >
          Plan a new trip
        </Button>
      </div>

      {/* Destination search — filters the city rail further down the page. */}
      <div className="delay-3 relative mt-8 animate-fade-up">
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
          className="h-14 w-full rounded-full border border-white/30 bg-surface/95 pr-5 pl-13 text-sm text-ink-900 shadow-lift transition-colors outline-none placeholder:text-ink-300 focus:border-clay-400 focus:ring-4 focus:ring-clay-500/20"
        />
      </div>
    </div>
  </section>
);
