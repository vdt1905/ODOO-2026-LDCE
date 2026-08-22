import { useNavigate } from 'react-router-dom';
import { ArrowRight, WifiOff } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { usePopularCities } from '../../hooks/usePopularCities.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { CityCard, CityCardSkeleton } from './CityCard.jsx';

/** "Top Regional Selections" from the mockup — a horizontal rail of cities. */
export const DestinationRail = () => {
  const navigate = useNavigate();
  const { cities, loading, offline } = usePopularCities(8);

  return (
    <section id="destinations" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="brand">Top regional selections</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            Where people are heading
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Sorted by how often travellers add them to a trip. The bar shows how far a day's
            budget stretches.
          </p>
        </div>

        <Button
          to={ROUTES.cities}
          variant="outline"
          size="sm"
          rightIcon={<ArrowRight className="size-4" />}
        >
          Browse all
        </Button>
      </div>

      {offline && !loading && (
        <p className="mt-6 flex items-center gap-2 text-xs text-ink-500">
          <WifiOff className="size-3.5" aria-hidden />
          Showing sample destinations — start the API to load the live catalog.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <CityCardSkeleton key={i} />)
          : cities.map((city) => (
              <CityCard
                key={city._id}
                city={city}
                onClick={() => navigate(`${ROUTES.cities}?search=${encodeURIComponent(city.name)}`)}
              />
            ))}
      </div>
    </section>
  );
};
