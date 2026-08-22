import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { ROUTES } from '../../lib/constants.js';
import { Button } from '../ui/Button.jsx';

export const CtaBand = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-4xl bg-ink-900 px-6 py-16 text-center sm:px-12">
        {/* Warm glow echoing the hero */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-moss-500/20 blur-3xl" />

        <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
          {user ? `Ready for the next one, ${user.firstName}?` : 'Your next trip starts here'}
        </h2>
        <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70">
          {user
            ? 'Pick the dates, drop in the cities, and let the budget keep itself in check.'
            : 'Create a free account and build your first multi-city itinerary in a few minutes.'}
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            to={user ? ROUTES.newTrip : ROUTES.register}
            variant="light"
            size="lg"
            rightIcon={<ArrowRight className="size-4" />}
          >
            {user ? 'Plan a new trip' : 'Create your account'}
          </Button>
          {!user && (
            <Button to={ROUTES.login} variant="glass" size="lg">
              I already have one
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
