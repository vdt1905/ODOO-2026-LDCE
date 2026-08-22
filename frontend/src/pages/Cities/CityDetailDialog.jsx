import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, Plus, X } from 'lucide-react';

import { activityApi } from '../../api/activity.api.js';
import { cn } from '../../lib/cn.js';
import { ROUTES, ACTIVITY_TYPE_META, gradientFor } from '../../lib/constants.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Badge, Button, EmptyState } from '../../components/ui/index.js';

const ActivityRow = ({ activity, currency }) => {
  const meta = ACTIVITY_TYPE_META[activity.type];

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-inset px-3.5 py-3">
      <span aria-hidden className="text-base leading-6">
        {meta?.emoji || '📍'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{activity.name}</p>
        <p className="mt-0.5 text-xs text-ink-500">
          {meta?.label || activity.type} · {formatDuration(activity.durationMinutes)}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-ink-900">
        {activity.cost > 0 ? formatCurrency(activity.cost, currency) : 'Free'}
      </span>
    </li>
  );
};

/**
 * City detail, opened from a result card.
 *
 * A dialog rather than its own route: the answer to "what is Kyoto like?" is
 * two paragraphs and a shortlist, and sending someone to a full page for that
 * costs them their scroll position in the results they were browsing.
 *
 * Built on <dialog> for the same reasons as ConfirmDialog — the browser owns
 * the top layer, the backdrop, Escape and the focus trap.
 */
export const CityDetailDialog = ({ city, onClose, canAddToTrip }) => {
  const ref = useRef(null);

  const { data, loading, error } = useAsync(
    () => activityApi.list({ city: city._id, limit: 6, sort: 'rating' }),
    [city?._id],
    { enabled: Boolean(city) }
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (city && !dialog.open) dialog.showModal();
    if (!city && dialog.open) dialog.close();
  }, [city]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;

    // Escape fires 'cancel'; route it through onClose so the parent's state
    // cannot drift out of sync with the dialog's own open flag.
    const handleCancel = (event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const activities = data?.items || [];

  return (
    <dialog
      ref={ref}
      aria-label={city ? `${city.name}, ${city.country}` : 'City details'}
      className="m-auto w-[min(40rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-line bg-surface p-0 text-ink-900 backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {city && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="relative aspect-[16/7]">
            {city.imageUrl ? (
              <img src={city.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  gradientFor(city.name + city.country)
                )}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-ink-900/30" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 grid size-9 place-items-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/35"
            >
              <X className="size-4" aria-hidden />
            </button>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <Badge tone="glass">{city.region}</Badge>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">{city.name}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/85">
                <MapPin className="size-3.5" aria-hidden />
                {city.country}
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {city.description && (
              <p className="text-sm leading-relaxed text-ink-700">{city.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-inset p-4 text-sm sm:grid-cols-3">
              <div>
                {/* 1–100, not a price — a currency symbol here would be a lie. */}
                <dt className="text-xs text-ink-500">Cost index</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{city.costIndex ?? 50}/100</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Popularity</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{city.popularity ?? 50}/100</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Local currency</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{city.currency || 'USD'}</dd>
              </div>
              {/* Absent on most seeded cities, so the row only appears when the
                  catalog actually carries coordinates. */}
              {(city.latitude ?? null) !== null && (city.longitude ?? null) !== null && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-ink-500">Coordinates</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}
                  </dd>
                </div>
              )}
            </dl>

            <section>
              <h3 className="font-display text-xl text-ink-900">Things to do</h3>

              {error && (
                <Alert tone="error" className="mt-3">
                  {error.message}
                </Alert>
              )}

              {loading && (
                <ul className="mt-3 space-y-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className="h-14 animate-pulse rounded-2xl bg-canvas-deep" />
                  ))}
                </ul>
              )}

              {!loading && !error && activities.length === 0 && (
                <EmptyState
                  compact
                  className="mt-3"
                  icon={Compass}
                  title="Nothing listed yet"
                  description="No activities have been catalogued for this city — you can still add your own once it is a stop on a trip."
                />
              )}

              {!loading && activities.length > 0 && (
                <>
                  <ul className="mt-3 space-y-2">
                    {activities.map((activity) => (
                      <ActivityRow
                        key={activity._id}
                        activity={activity}
                        currency={city.currency}
                      />
                    ))}
                  </ul>
                  {data?.total > activities.length && (
                    <Link
                      to={`${ROUTES.activities}?city=${city._id}`}
                      className="mt-3 inline-block text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                    >
                      All {data.total} things to do in {city.name}
                    </Link>
                  )}
                </>
              )}
            </section>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {canAddToTrip && (
                // A query param, not router state: Create Trip reads ?city= and
                // resolves it itself, which also makes the link shareable.
                <Button
                  to={`${ROUTES.newTrip}?city=${city._id}`}
                  leftIcon={<Plus className="size-4" />}
                >
                  Add to a trip
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
};
