import { useNavigate } from 'react-router-dom';
import { ArrowRight, WifiOff } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { usePopularCities } from '../../hooks/usePopularCities.js';
import { Section, SectionHeading } from '../layout/Section.jsx';
import { CityCard, CityCardSkeleton } from './CityCard.jsx';

/**
 * Four destinations, on the landing page.
 *
 * The tiles are the shared <CityCard>, not a private copy — this rail, the
 * dashboard grid and the Discover results are the same object seen three times,
 * and when they were three hand-rolled markups they drifted apart within a
 * fortnight. Anything that should change about a destination tile changes in
 * CityCard.jsx and lands in all three.
 */
export const DestinationRail = () => {
  const navigate = useNavigate();
  const { cities, loading, offline } = usePopularCities(4);

  const open = (city) =>
    navigate(`${ROUTES.cities}?search=${encodeURIComponent(city.name)}`);

  return (
    <Section id="destinations" tone="canvas" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Start somewhere"
        title="Cities worth the detour"
        sub="Thirty catalogued destinations with a cost index, a popularity read and the activities already attached — so a stop is a decision, not a research project."
        action={
          <button
            type="button"
            onClick={() => navigate(ROUTES.cities)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Browse all cities
            <ArrowRight className="size-4" aria-hidden />
          </button>
        }
      />

      {offline && !loading && (
        <p className="mt-5 flex items-center gap-2 text-xs text-ink-500">
          <WifiOff className="size-3.5" aria-hidden />
          Showing sample destinations while the catalog reconnects.
        </p>
      )}

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => <CityCardSkeleton key={index} />)
          : cities
              .slice(0, 4)
              .map((city) => (
                <CityCard key={city._id || city.name} city={city} onClick={() => open(city)} />
              ))}
      </div>
    </Section>
  );
};
