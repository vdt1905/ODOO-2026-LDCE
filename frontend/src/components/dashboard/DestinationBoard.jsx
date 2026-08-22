import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, SearchX, WifiOff } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { useCityCatalog } from '../../hooks/useCityCatalog.js';
import { Badge, Button, EmptyState } from '../ui/index.js';
import { CityCard, CityCardSkeleton } from '../landing/CityCard.jsx';

/**
 * "Top Regional Selections" on the dashboard, driven by the banner's search box.
 *
 * Picking a city goes straight to Create Trip with that city pre-selected, so
 * the search bar leads somewhere useful instead of into a results page that
 * only tells you what you already searched for.
 */
export const DestinationBoard = ({ query }) => {
  const navigate = useNavigate();
  const { cities, loading, error } = useCityCatalog({ search: query, limit: 8 });

  const searching = Boolean(query.trim());

  return (
    <section id="destinations" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="clay">Top regional selections</Badge>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            {searching ? `Destinations matching “${query.trim()}”` : 'Where people are heading'}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">
            Pick one and it lands in a new trip, dates and all. The bar shows how far a day&apos;s
            budget stretches there.
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

      {error && !loading && (
        <p className="mt-6 flex items-center gap-2 text-xs text-ink-500">
          <WifiOff className="size-3.5" aria-hidden />
          The city catalog is unreachable right now — {error.message}
        </p>
      )}

      {!loading && !error && cities.length === 0 && (
        <EmptyState
          compact
          className="mt-6"
          icon={searching ? SearchX : Compass}
          title={searching ? 'No cities match that search' : 'The catalog is empty'}
          description={
            searching
              ? 'Try a country, a region, or just a shorter spelling.'
              : 'Run `npm run seed` in the backend to load the 30 starter cities.'
          }
        />
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <CityCardSkeleton key={i} />)
          : cities.map((city) => (
              <CityCard
                key={city._id}
                city={city}
                onClick={() => navigate(`${ROUTES.newTrip}?city=${city._id}`)}
              />
            ))}
      </div>
    </section>
  );
};
