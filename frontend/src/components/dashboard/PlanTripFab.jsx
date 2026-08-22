import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';

/**
 * The floating "Plan a trip" button from the bottom-right of the mockup.
 *
 * Brand green because it is the primary action of the whole screen, and it has
 * to stay recognisable as the same button after you have scrolled past the one
 * in the header. Sits above the footer and stays clear of iOS home indicators
 * via env(safe-area-inset-bottom).
 *
 * It shares the bottom-right corner with the Ask AI launcher, which is mounted
 * globally and therefore owns the corner itself. So this one is parked one row
 * above it — same right edge, so the two read as a deliberate stack rather than
 * two buttons that happen to have landed on top of each other.
 */
export const PlanTripFab = () => (
  <Link
    to={ROUTES.newTrip}
    className="fixed right-5 bottom-[4.75rem] z-40 inline-flex items-center gap-2 rounded-full border border-brand-600 bg-brand-500 py-3.5 pr-6 pl-5 font-sans text-sm font-semibold text-white shadow-lift transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0 active:scale-[0.97]"
    style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
  >
    <Plus className="size-4 shrink-0" aria-hidden />
    Plan a trip
  </Link>
);
