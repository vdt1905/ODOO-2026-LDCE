import { ArrowRight, ChevronDown, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { ROUTES } from '../../lib/constants.js';
import { Button } from '../ui/Button.jsx';
import { HeroScene } from './HeroScene.jsx';
import { HeroSearch } from './HeroSearch.jsx';

export const Hero = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-20">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10">
        <HeroScene />
        {/* Two scrims keep white text legible over the pale sky without
            flattening the scene: a soft pool behind the copy, plus edge shading
            for the nav and the scroll pill. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_46%_at_50%_44%,rgba(23,20,15,0.5),rgba(23,20,15,0.12)_62%,transparent_78%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/35 via-transparent to-ink-900/30" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-moss-300" />
          Built for the Odoo Hackathon · Team LDCE
        </span>

        <h1 className="delay-1 mt-6 animate-fade-up font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(23,20,15,0.35)] sm:text-6xl md:text-7xl">
          Plan the trip.
          <br />
          Not the spreadsheet.
        </h1>

        <p className="delay-2 mx-auto mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-white/90 drop-shadow-[0_1px_10px_rgba(23,20,15,0.4)] sm:text-lg">
          Multi-city itineraries, day by day. Costs that add themselves up as you go.
          One link to share the whole plan.
        </p>

        <div className="delay-3 mt-9 animate-fade-up">
          <HeroSearch />
        </div>

        <div className="delay-4 mt-4 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            to={user ? ROUTES.newTrip : ROUTES.register}
            variant="light"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
          >
            {user ? 'Plan a new trip' : 'Get started'}
          </Button>

          <Button
            to={ROUTES.cities}
            variant="glass"
            size="lg"
            leftIcon={<Play className="size-3.5 fill-current" />}
          >
            Explore destinations
          </Button>
        </div>
      </div>

      <a
        href="#destinations"
        className="absolute bottom-8 flex animate-fade-up [animation-delay:0.4s] items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-[11px] font-medium tracking-[0.18em] text-white/90 uppercase backdrop-blur-md transition-colors hover:bg-white/22"
      >
        Scroll
        <ChevronDown className="size-3.5 animate-bounce" />
      </a>
    </section>
  );
};
