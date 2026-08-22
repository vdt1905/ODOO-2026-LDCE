import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, RotateCcw, SearchX } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { useCityCatalog } from '../../hooks/useCityCatalog.js';
import { Alert, Button, EmptyState } from '../ui/index.js';
import { Section, SectionHeading } from '../layout/Section.jsx';
import { CityCard, CityCardSkeleton } from '../landing/CityCard.jsx';

/**
 * "Top Regional Selections" on the dashboard, driven by the banner's search box.
 *
 * Picking a city goes straight to Create Trip with that city pre-selected, so
 * the search bar leads somewhere useful instead of into a results page that
 * only tells you what you already searched for.
 *
 * Three states, always: skeleton cards in the real grid while it loads, an
 * ember banner if the catalog is unreachable, and an empty state that says
 * whether the search found nothing or the catalog itself is unseeded.
 */
export const DestinationBoard = ({ query }) => {
  const navigate = useNavigate();
  const { cities, loading, error } = useCityCatalog({ search: query, limit: 8 });

  const term = query.trim();
  const searching = Boolean(term);

  return (
    <Section id="destinations" tone="surface" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Top regional selections"
        title={searching ? `Cities matching “${term}”` : 'Where people are heading'}
        sub="Pick one and it lands in a new trip, dates and all. The bar on each card shows how far a day’s budget stretches there."
        action={
          <Button
            to={ROUTES.cities}
            variant="outline"
            rightIcon={<ArrowRight className="size-4" />}
          >
            Browse all destinations
          </Button>
        }
      />

      <div className="mt-10">
        {loading ? (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            aria-busy="true"
            aria-label="Loading destinations"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <CityCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Alert
            tone="error"
            title="The city catalog is unreachable"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                leftIcon={<RotateCcw className="size-4" />}
              >
                Reload
              </Button>
            }
          >
            {error.message} Your own trips below are unaffected.
          </Alert>
        ) : cities.length === 0 ? (
          <EmptyState
            compact
            icon={searching ? SearchX : Compass}
            title={searching ? 'No cities match that search' : 'The catalog is empty'}
            description={
              searching
                ? 'Try a country, a region, or just a shorter spelling.'
                : 'Run `npm run seed` in the backend to load the 30 starter cities.'
            }
            action={
              searching && (
                <Button to={ROUTES.cities} variant="outline">
                  Browse the whole catalog
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cities.map((city) => (
              <CityCard
                key={city._id}
                city={city}
                onClick={() => navigate(`${ROUTES.newTrip}?city=${city._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};
