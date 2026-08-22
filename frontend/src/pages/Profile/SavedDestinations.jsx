import { useState } from 'react';
import { Bookmark, MapPin, X } from 'lucide-react';

import { toApiError } from '../../api/client.js';
import { userApi } from '../../api/user.api.js';
import { ROUTES } from '../../lib/constants.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuthStore } from '../../store/authStore.js';
import { Alert, Button, EmptyState } from '../../components/ui/index.js';

const idsOf = (items) => items.map((item) => String(item?._id || item));

export const SavedDestinations = ({ ids = [] }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const [removingId, setRemovingId] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const { data: cities, loading, error, setData } = useAsync(
    () => userApi.savedDestinations(),
    [JSON.stringify(ids)],
    { initial: [] }
  );

  const remove = async (city) => {
    setRemovingId(city._id);
    setMutationError(null);
    try {
      const items = await userApi.unsaveDestination(city._id);
      setData(items);
      const current = useAuthStore.getState().user;
      if (current) setUser({ ...current, savedDestinations: idsOf(items) });
    } catch (caught) {
      setMutationError(toApiError(caught).message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section aria-labelledby="saved-destinations">
      <h2 id="saved-destinations" className="font-display text-xl text-ink-900">Saved destinations</h2>
      <p className="mt-1 text-sm text-ink-500">Cities you bookmarked while browsing.</p>

      <div className="mt-4 space-y-4">
        {(error || mutationError) && (
          <Alert tone="error" title="Your saved cities could not be updated">
            {mutationError || error.message}
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
              <li key={city._id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-2 pr-2 pl-3 text-sm text-ink-900">
                <MapPin className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                <span className="font-medium">{city.name}</span>
                <span className="text-ink-500">{city.country}</span>
                <button
                  type="button"
                  title={`Remove ${city.name} from saved destinations`}
                  aria-label={`Remove ${city.name} from saved destinations`}
                  disabled={removingId === city._id}
                  onClick={() => remove(city)}
                  className="grid size-7 place-items-center rounded-full text-ink-300 transition-colors hover:bg-ember-50 hover:text-ember-700 disabled:opacity-40"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Bookmark}
            title="Nothing saved yet"
            description="Bookmark a city while you browse and it will wait for you here."
            action={<Button to={ROUTES.cities} variant="outline">Browse destinations</Button>}
          />
        )}
      </div>
    </section>
  );
};
