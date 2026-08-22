import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo.jsx';
import { Section } from './Section.jsx';
import { ROUTES } from '../../lib/constants.js';

const COLUMNS = [
  {
    title: 'Plan',
    links: [
      { label: 'Create a trip', to: ROUTES.newTrip },
      { label: 'My trips', to: ROUTES.trips },
      { label: 'Destinations', to: ROUTES.cities },
      { label: 'Activities', to: ROUTES.activities },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Community', to: ROUTES.community },
      { label: 'Popular cities', to: ROUTES.cities },
      { label: 'Sign up', to: ROUTES.register },
      { label: 'Login', to: ROUTES.login },
    ],
  },
];

/**
 * The footer is the same deep forest as the About/Contact band above it, so the
 * page closes on one continuous dark block instead of dropping from dark type
 * into a cream strip. A single white/10 rule marks the join; there is no change
 * of ground. It uses <Section> for its rhythm like every other band, so the
 * gutters line up with the content above.
 */
export const Footer = () => (
  <Section as="footer" tone="dark" tight className="border-t border-white/10">
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <Logo tone="light" />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-canvas/60">
          Build multi-city itineraries, watch the budget as you plan, and share the whole
          trip with one link.
        </p>
      </div>

      {COLUMNS.map((column) => (
        <div key={column.title}>
          <h4 className="text-lg uppercase text-canvas">{column.title}</h4>
          <ul className="mt-4 space-y-2.5">
            {column.links.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="rounded text-sm text-canvas/60 transition-colors hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-canvas/50 sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} TRIPORA · Built for the Odoo Hackathon</p>
      <p>Team LDCE</p>
    </div>
  </Section>
);
