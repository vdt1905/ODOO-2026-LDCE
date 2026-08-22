import { ArrowRight, Compass } from 'lucide-react';

import { Section, SectionHeading } from '../layout/Section.jsx';
import { Button } from '../ui/index.js';
import { ROUTES } from '../../lib/constants.js';

/**
 * The closing band, and the darkest thing on the page.
 *
 * `tone="dark"` paints the ground; the photograph sits on a negative z-index
 * inside the section's own stacking context, which puts it above the band's
 * background but below every child — so it never needs its own wrapper and
 * the content keeps the shared `.shell` measure. `isolate` stops that
 * negative layer from escaping into the page behind it.
 */
export const CtaBand = () => (
  <Section tone="dark" className="relative isolate overflow-hidden">
    <img
      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=70"
      alt=""
      aria-hidden
      loading="lazy"
      className="absolute inset-0 -z-20 size-full object-cover opacity-40"
    />
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-linear-to-b from-brand-700/85 via-brand-700/75 to-brand-700/90"
    />

    <div className="flex flex-col items-center text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-canvas/25 bg-brand-700/40 text-canvas">
        <Compass className="size-5" aria-hidden />
      </span>

      <SectionHeading
        align="center"
        invert
        eyebrow="Start planning"
        title="Your next trip is already half planned"
        sub="Free while we are in beta. No card, no lock-in, and the itinerary stays yours — export it, share it, or keep it private."
        className="mt-7"
      />

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button
          to={ROUTES.register}
          variant="light"
          size="lg"
          rightIcon={<ArrowRight className="size-4" aria-hidden />}
        >
          Create an account
        </Button>
        <Button to={ROUTES.community} variant="glass" size="lg">
          Explore public trips
        </Button>
      </div>
    </div>
  </Section>
);
