import { ArrowRight } from 'lucide-react';

import { publicApi } from '../../api/public.api.js';
import { ROUTES } from '../../lib/constants.js';
import { useAsync } from '../../hooks/useAsync.js';
import { CommunityCard } from '../../pages/Community/CommunityCard.jsx';
import { Section, SectionHeading } from '../layout/Section.jsx';
import { Button } from '../ui/index.js';

/**
 * Three published itineraries, straight from the community feed.
 *
 * This is a marketing rail rather than a screen of its own, so it stays
 * silent when it has nothing worth showing: while the request is in flight,
 * and when the feed comes back empty or unreachable. An empty state or an
 * error alert here would be shouting about a section the visitor never asked
 * for — /community owns those states.
 */
export const CommunityPreview = () => {
  const { data, loading } = useAsync(() => publicApi.list({ sort: 'popular', limit: 3 }), []);
  const trips = data?.items ?? [];

  if (loading || trips.length === 0) return null;

  return (
    <Section tone="surface">
      <SectionHeading
        eyebrow="From the community"
        title="Copy a trip that already works"
        sub="Real itineraries other travellers have published, with the stops, days and costs still attached. Open one, copy it to your account, then change whatever you like."
        action={
          <Button
            to={ROUTES.community}
            variant="outline"
            rightIcon={<ArrowRight className="size-4" aria-hidden />}
          >
            Open public plans
          </Button>
        }
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <CommunityCard key={trip.publicSlug} trip={trip} />
        ))}
      </div>
    </Section>
  );
};
