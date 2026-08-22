import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo.jsx';
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

export const Footer = () => (
  <footer className="border-t border-line bg-canvas-deep">
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            Build multi-city itineraries, watch the budget as you plan, and share the whole
            trip with one link.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h4 className="text-sm font-semibold text-ink-900">{column.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} GlobeTrotter · Built for the Odoo Hackathon</p>
        <p>Team LDCE</p>
      </div>
    </div>
  </footer>
);
