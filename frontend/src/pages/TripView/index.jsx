import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  Compass,
  LayoutList,
  Map,
  MapPin,
  Moon,
  Pencil,
  Ticket,
  Wallet,
} from 'lucide-react';

import { tripApi } from '../../api/trip.api.js';
import { cn } from '../../lib/cn.js';
import { BANNERS, ROUTES } from '../../lib/constants.js';
import { formatDateRange } from '../../lib/dates.js';
import { formatCurrency, formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Alert, Button, EmptyState } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { DayCard, DayCardSkeleton } from './DayCard.jsx';
import { ShareCard } from './ShareCard.jsx';

const VIEWS = [
  { value: 'day', label: 'By day', icon: LayoutList },
  { value: 'city', label: 'By city', icon: Map },
];

const ViewToggle = ({ view, onChange }) => (
  <div
    role="group"
    aria-label="Itinerary view"
    className="inline-flex rounded-full border border-line bg-surface p-1"
  >
    {VIEWS.map(({ value, label, icon: Icon }) => (
      <button
        key={value}
        type="button"
        onClick={() => onChange(value)}
        aria-pressed={view === value}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
          view === value ? 'bg-brand-500 text-white' : 'text-ink-700 hover:bg-canvas-deep'
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </button>
    ))}
  </div>
);

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
    <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-ink-500">
      <Icon className="size-3.5" aria-hidden />
      {label}
    </p>
    <p className="mt-2 truncate font-display text-2xl text-ink-900">{value}</p>
  </div>
);

/**
 * Itinerary view — the read-only day-by-day plan for one trip.
 *
 * Both view modes come straight off the API: `days` is one row per calendar day
 * and `byCity` is those same day objects grouped by stop. Nothing is regrouped
 * or re-summed here, so this screen can never disagree with the budget screen.
 */
const TripViewPage = () => {
  const { id } = useParams();
  const [view, setView] = useState('day');

  const { data, loading, error, setData } = useAsync(() => tripApi.itinerary(id), [id]);

  const trip = data?.trip;
  usePageTitle(trip?.name || 'Itinerary');

  // Patch the local copy after publish/unshare instead of refetching every day.
  const applyVisibility = ({ isPublic, publicSlug }) =>
    setData((current) =>
      current ? { ...current, trip: { ...current.trip, isPublic, publicSlug } } : current
    );

  const currency = trip?.currency;
  // A limit of 0 means "no limit" everywhere else in the app, so treat it as one.
  const hasBudgetLimit = Boolean(trip?.budgetLimit);

  // Days outside every stop never appear in `byCity`; count them so the city
  // view can say so rather than silently losing them.
  const looseDays = data ? data.days.filter((day) => !day.stop).length : 0;

  return (
    <>
      <PageHeader
        size="lg"
        image={trip?.coverPhotoUrl || BANNERS.trip}
        kicker={trip ? formatDateRange(trip.startDate, trip.endDate) : 'Itinerary'}
        title={trip?.name || 'Itinerary'}
        sub={trip?.description || undefined}
        breadcrumb={[
          { label: 'My trips', to: ROUTES.trips },
          { label: trip?.name || 'Trip' },
        ]}
        actions={
          <>
            <Button
              to={ROUTES.tripBuilder(id)}
              variant="light"
              leftIcon={<Pencil className="size-4" />}
            >
              Edit itinerary
            </Button>
            <Button
              to={ROUTES.tripBudget(id)}
              variant="glass"
              leftIcon={<Wallet className="size-4" />}
            >
              Budget
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        {error && (
          <Alert tone="error" title="This itinerary could not be loaded">
            {error.message}
          </Alert>
        )}

        <section aria-label="Trip at a glance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-26 animate-pulse rounded-3xl bg-canvas-deep" />
            ))
          ) : (
            <>
              <Stat icon={CalendarDays} label="Days" value={formatNumber(data?.totalDays ?? 0)} />
              <Stat icon={MapPin} label="Cities" value={formatNumber(data?.stopCount ?? 0)} />
              <Stat icon={Ticket} label="Activities" value={formatNumber(data?.activityCount ?? 0)} />
              <Stat
                icon={Wallet}
                label="Budget limit"
                value={hasBudgetLimit ? formatCurrency(trip.budgetLimit, currency) : 'No limit'}
              />
            </>
          )}
        </section>

        {trip && (
          <ShareCard
            tripId={id}
            isPublic={trip.isPublic}
            publicSlug={trip.publicSlug}
            onVisibilityChange={applyVisibility}
          />
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-ink-900">The plan</h2>
              <p className="mt-1 text-sm text-ink-500">
                {loading
                  ? 'Loading the itinerary…'
                  : view === 'day'
                    ? `${pluralise(data?.totalDays ?? 0, 'day')}, empty ones included.`
                    : `${pluralise(data?.stopCount ?? 0, 'city', 'cities')} in the order you travel them.`}
              </p>
            </div>

            <ViewToggle view={view} onChange={setView} />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <DayCardSkeleton key={i} />
                ))}
              </div>
            ) : !data ? null : view === 'day' ? (
              <div className="space-y-4">
                {data.days.map((day) => (
                  <DayCard key={day.date} day={day} currency={currency} />
                ))}
              </div>
            ) : data.byCity.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No cities on this trip yet"
                description="Add a stop in the builder and its days will show up here, grouped by city."
                action={
                  <Button to={ROUTES.tripBuilder(id)} size="lg">
                    Add your first stop
                  </Button>
                }
              />
            ) : (
              <div className="space-y-10">
                {data.byCity.map((group, index) => (
                  <section key={group.stopId}>
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="eyebrow text-ink-500">Stop {index + 1}</p>
                        <h3 className="mt-1 font-display text-2xl text-ink-900">
                          {group.city}
                          {group.country && (
                            <span className="text-ink-500">, {group.country}</span>
                          )}
                        </h3>
                      </div>

                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {formatDateRange(group.startDate, group.endDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Moon className="size-3.5" aria-hidden />
                          {pluralise(group.nights, 'night')}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 space-y-4">
                      {group.days.map((day) => (
                        <DayCard key={day.date} day={day} currency={currency} showCity={false} />
                      ))}
                    </div>
                  </section>
                ))}

                {looseDays > 0 && (
                  <Alert tone="info" title={`${pluralise(looseDays, 'day')} not assigned to a city`}>
                    They only show up in the by-day view. Stretch a stop's dates in the builder to
                    cover them.
                  </Alert>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default TripViewPage;
