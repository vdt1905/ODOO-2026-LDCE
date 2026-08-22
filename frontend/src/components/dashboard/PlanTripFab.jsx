import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';

/**
 * The floating "+ Plan a trip" button from the bottom-right of the mockup.
 *
 * Sits above the footer with `sticky`-style insets and stays out of the way of
 * iOS home indicators via env(safe-area-inset-bottom).
 */
export const PlanTripFab = () => (
  <Link
    to={ROUTES.newTrip}
    className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink-900 py-3.5 pr-6 pl-5 text-sm font-semibold text-canvas shadow-lift transition-all duration-200 hover:bg-clay-600 hover:text-white active:scale-[0.97] sm:right-6 sm:bottom-6"
    style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
  >
    <Plus className="size-4" aria-hidden />
    Plan a trip
  </Link>
);
