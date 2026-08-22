import { Bookmark, MapPin } from 'lucide-react';

import { cityApi } from '../../api/city.api.js';
import { ROUTES } from '../../lib/constants.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Button, EmptyState } from '../../components/ui/index.js';

/**
 * `user.savedDestinations` is a bare string[] of city ids — the API never
 * populates it — so the names are resolved here one call per id. A dud id
 * resolves to null and is dropped rather than failing the whole section: the
 * user never typed it, so there is nothing for them to fix.
 */
export const SavedDestinations = ({ ids = [] }) => {
  const { data: cities, loading, error } = useAsync(
    () =>
      Promise.all(ids.map((id) => cityApi.byId(id).catch(() => null))).then((rows) =>
        rows.filter(Boolean)
      ),
    [JSON.stringify(ids)],
    { enabled: ids.length > 0, initial: [] }
  );

  return (
    <section aria-labelledby="saved-destinations">
      <h2 id="saved-destinations" className="font-display text-xl text-ink-900">
        Saved destinations
      </h2>
      <p className="mt-1 text-sm text-ink-500">Cities you bookmarked while browsing.</p>

      <div className="mt-4 space-y-4">
        {error && (
          <Alert tone="error" title="Your saved cities could not be loaded">
            {error.message}
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-10 w-36 animate-pulse rounded-full bg-canvas-deep" />
            ))}
          </div>
        ) : cities?.length ? (
          <ul className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <li
                key={city._id}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pr-4 pl-3 text-sm text-ink-900"
              >
                <MapPin className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                <span className="font-medium">{city.name}</span>
                <span className="text-ink-500">{city.country}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Bookmark}
            title="Nothing saved yet"
            description="Bookmark a city while you browse and it will wait for you here."
            action={
              <Button to={ROUTES.cities} variant="outline">
                Browse destinations
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
};
