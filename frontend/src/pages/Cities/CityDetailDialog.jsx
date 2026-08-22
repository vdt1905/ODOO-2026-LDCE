import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass, MapPin, Plus, RefreshCw, X } from 'lucide-react';

import { activityApi } from '../../api/activity.api.js';
import { cn } from '../../lib/cn.js';
import { ROUTES, ACTIVITY_TYPES, ACTIVITY_TYPE_META, gradientFor } from '../../lib/constants.js';
import { formatCurrency, formatDuration } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Badge, Button, EmptyState } from '../../components/ui/index.js';
import { ActivityIcon } from '../../components/ui/ActivityIcon.jsx';

/** Catalog order, so the groups below always come out in the same sequence. */
const TYPE_ORDER = ACTIVITY_TYPES.map((type) => type.value);

const ActivityRow = ({ activity, currency }) => (
  <li className="flex items-start gap-3 rounded-2xl border border-line-soft bg-inset px-4 py-3 transition-colors hover:border-line">
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-ink-900">{activity.name}</p>
      <p className="mt-0.5 text-xs text-ink-500">{formatDuration(activity.durationMinutes)}</p>
    </div>
    <span className="shrink-0 font-display text-base leading-none text-ink-900">
      {activity.cost > 0 ? formatCurrency(activity.cost, currency) : 'Free'}
    </span>
  </li>
);

/** A figure and what it measures — the number is the biggest thing in the tile. */
const StatTile = ({ label, value, suffix }) => (
  <div className="rounded-2xl border border-line bg-inset p-4">
    <dt className="text-[11px] font-semibold tracking-[0.09em] text-ink-500 uppercase">{label}</dt>
    <dd className="mt-1.5 flex items-baseline gap-1 font-display text-2xl leading-none text-ink-900">
      {value}
      {suffix && <span className="text-sm text-ink-500">{suffix}</span>}
    </dd>
  </div>
);

/**
 * City detail, opened from a result card.
 *
 * A dialog rather than its own route: the answer to "what is Kyoto like?" is
 * two paragraphs and a shortlist, and sending someone to a full page for that
 * costs them their scroll position in the results they were browsing.
 *
 * Built on <dialog> for the same reasons as ConfirmDialog — the browser owns
 * the top layer, the backdrop, Escape and the focus trap.
 *
 * Three fixed bands: a photograph that names the place, a scrolling body, and a
 * footer that never leaves the screen, so the primary action is reachable from
 * anywhere in a long list of things to do.
 */
export const CityDetailDialog = ({
  city,
  onClose,
  canAddToTrip,
  isSaved = false,
  saving = false,
  onToggleSave,
}) => {
  const ref = useRef(null);

  const { data, loading, error, refresh } = useAsync(
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

  const activities = useMemo(() => data?.items || [], [data]);

  /**
   * Grouped by type so six results read as "two food, one hike" rather than a
   * flat list — the shape of a city is what someone is actually scanning for.
   * Unknown types (nothing in the catalog enum) sort to the end instead of
   * being dropped.
   */
  const groups = useMemo(() => {
    const buckets = new Map();
    for (const activity of activities) {
      const key = activity.type || 'custom';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(activity);
    }

    const rank = (type) => {
      const index = TYPE_ORDER.indexOf(type);
      return index === -1 ? TYPE_ORDER.length : index;
    };

    return [...buckets.entries()].sort(([a], [b]) => rank(a) - rank(b));
  }, [activities]);

  return (
    <dialog
      ref={ref}
      aria-label={city ? `${city.name}, ${city.country}` : 'City details'}
      className="m-auto w-[min(42rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-line bg-surface p-0 text-ink-900 backdrop:bg-ink-900/50 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {city && (
        <div className="flex max-h-[88vh] flex-col">
          {/* ---- Photo header ------------------------------------------- */}
          <div className="relative aspect-[16/7] shrink-0">
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
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-ink-900/35" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/35"
            >
              <X className="size-4" aria-hidden />
            </button>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="glass">{city.region}</Badge>
                <Badge tone="glass">
                  <MapPin className="size-3" aria-hidden />
                  {city.country}
                </Badge>
                <Badge tone="glass">{city.currency || 'USD'}</Badge>
              </div>

              <h2 className="mt-3 font-display-caps text-3xl leading-none text-white drop-shadow-[0_2px_18px_rgba(18,22,18,0.5)] sm:text-4xl">
                {city.name}
              </h2>
            </div>
          </div>

          {/* ---- Scrolling body ----------------------------------------- */}
          {/* `min-h-0` is load-bearing: without it a flex child refuses to
              shrink below its content and the body never scrolls. */}
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-5 sm:p-6">
            {city.description && (
              <p className="text-sm leading-relaxed text-ink-700">{city.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* 1–100, not a price — a currency symbol here would be a lie. */}
              <StatTile label="Cost index" value={city.costIndex ?? 50} suffix="/100" />
              <StatTile label="Popularity" value={city.popularity ?? 50} suffix="/100" />
              <StatTile label="Local currency" value={city.currency || 'USD'} />
              {/* Absent on most seeded cities, so the tile only appears when the
                  catalog actually carries coordinates. */}
              {(city.latitude ?? null) !== null && (city.longitude ?? null) !== null && (
                <div className="col-span-2 rounded-2xl border border-line bg-inset p-4 sm:col-span-3">
                  <dt className="text-[11px] font-semibold tracking-[0.09em] text-ink-500 uppercase">
                    Coordinates
                  </dt>
                  <dd className="mt-1.5 font-display text-lg leading-none text-ink-900">
                    {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}
                  </dd>
                </div>
              )}
            </dl>

            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-display text-xl leading-none text-ink-900 uppercase">
                  Things to do
                </h3>
                {!loading && !error && activities.length > 0 && (
                  <p className="text-xs text-ink-500">
                    Top {activities.length} of {data?.total ?? activities.length}, by rating
                  </p>
                )}
              </div>

              {error && (
                <Alert
                  tone="error"
                  title="Things to do could not be loaded"
                  className="mt-4"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refresh}
                      leftIcon={<RefreshCw className="size-4" />}
                    >
                      Try again
                    </Button>
                  }
                >
                  {error.message}
                </Alert>
              )}

              {loading && (
                <ul className="mt-4 space-y-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className="h-16 animate-pulse rounded-2xl bg-canvas-deep" />
                  ))}
                </ul>
              )}

              {!loading && !error && activities.length === 0 && (
                <EmptyState
                  compact
                  className="mt-4"
                  icon={Compass}
                  title="Nothing listed yet"
                  description="No activities have been catalogued for this city — you can still add your own once it is a stop on a trip."
                />
              )}

              {!loading && activities.length > 0 && (
                <>
                  <div className="mt-4 space-y-5">
                    {groups.map(([type, rows]) => {
                      const meta = ACTIVITY_TYPE_META[type];
                      return (
                        <div key={type}>
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.09em] text-ink-500 uppercase">
                            <ActivityIcon type={type} className="size-3.5" />
                            {meta?.label || type}
                          </p>
                          <ul className="mt-2 space-y-2">
                            {rows.map((activity) => (
                              <ActivityRow
                                key={activity._id}
                                activity={activity}
                                currency={city.currency}
                              />
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {data?.total > activities.length && (
                    <Link
                      to={`${ROUTES.activities}?city=${city._id}`}
                      className="mt-4 inline-block text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                    >
                      All {data.total} things to do in {city.name}
                    </Link>
                  )}
                </>
              )}
            </section>
          </div>

          {/* ---- Footer — always on screen ------------------------------ */}
          <div className="shrink-0 border-t border-line bg-surface p-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                {canAddToTrip ? (
                  <>
                    <Button
                      variant="outline"
                      loading={saving}
                      onClick={() => onToggleSave(city)}
                      leftIcon={
                        <Bookmark className="size-4" fill={isSaved ? 'currentColor' : 'none'} />
                      }
                    >
                      {isSaved ? 'Saved' : 'Save city'}
                    </Button>
                    {/* Query state keeps the selected city shareable. */}
                    <Button
                      to={`${ROUTES.newTrip}?city=${city._id}`}
                      leftIcon={<Plus className="size-4" />}
                    >
                      Add to a trip
                    </Button>
                  </>
                ) : (
                  <Button to={ROUTES.login}>Sign in to plan a trip</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
};
