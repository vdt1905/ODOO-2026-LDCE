import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Copy, Eye, Lock, LogIn, MapPin, Sparkles } from 'lucide-react';

import { publicApi } from '../../api/public.api.js';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { BANNERS, ROUTES } from '../../lib/constants.js';
import { formatDateRange } from '../../lib/dates.js';
import { formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Alert, Avatar, Button, EmptyState } from '../../components/ui/index.js';
import { BudgetSummary } from './BudgetSummary.jsx';
import { DayRow } from './DayRow.jsx';

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
    <Icon className="size-3.5" aria-hidden />
    {children}
  </span>
);

/**
 * A published itinerary, read-only — mockup screen 9.
 *
 * Unauthenticated, so everything on the page has to survive `user` being null;
 * the only signed-in affordance is "Copy this trip", which becomes a sign-in
 * link rather than disappearing.
 */
const PublicTripPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const { data, loading, error } = useAsync(() => publicApi.bySlug(slug), [slug]);

  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState(null);

  usePageTitle(data?.trip?.name || 'Shared itinerary');

  const copyTrip = async () => {
    if (!data?.tripId) return;

    setCopying(true);
    setCopyError(null);
    try {
      const result = await tripApi.copy(data.tripId);
      // No setCopying(false) on the happy path — this page is unmounting.
      navigate(ROUTES.trip(result.tripId));
    } catch (err) {
      setCopyError(toApiError(err).message);
      setCopying(false);
    }
  };

  /* An unknown slug, an unpublished trip and a deleted one all come back as a
     404, and none of them is something the reader can act on — one honest
     dead-end beats three. Anything else keeps the server's own wording. */
  if (error) {
    const missing = error.status === 404;

    return (
      <>
        <PageHeader
          image={BANNERS.publicTrip}
          kicker="Shared itinerary"
          title="Not available"
          breadcrumb={[{ label: 'Community', to: ROUTES.community }, { label: 'Not available' }]}
        />

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <EmptyState
            icon={Lock}
            title={
              missing
                ? 'This itinerary is private or no longer exists'
                : 'This itinerary could not be loaded'
            }
            description={
              missing
                ? 'The traveller may have unpublished it, or the link was mistyped. Plenty of others are still open.'
                : error.message
            }
            action={<Button to={ROUTES.community}>Browse the community</Button>}
          />
        </div>
      </>
    );
  }

  const trip = data?.trip;
  const owner = data?.owner;
  const days = data?.days ?? [];

  return (
    <>
      <PageHeader
        image={trip?.coverPhotoUrl || BANNERS.publicTrip}
        size="lg"
        kicker={owner?.firstName ? `Shared by ${owner.firstName}` : 'Shared itinerary'}
        title={trip?.name || 'Shared itinerary'}
        sub={trip?.description || undefined}
        breadcrumb={[
          { label: 'Community', to: ROUTES.community },
          { label: trip?.name || 'Itinerary' },
        ]}
        actions={
          data &&
          (user ? (
            <Button
              variant="light"
              loading={copying}
              onClick={copyTrip}
              leftIcon={<Copy className="size-4" />}
            >
              Copy this trip
            </Button>
          ) : (
            <Button
              to={ROUTES.login}
              // Login reads state.from, so signing in returns them here.
              state={{ from: location.pathname }}
              variant="light"
              leftIcon={<LogIn className="size-4" />}
            >
              Sign in to copy
            </Button>
          ))
        }
      >
        {data && (
          <div className="flex flex-wrap items-center gap-2">
            <Pill icon={CalendarDays}>{formatDateRange(trip.startDate, trip.endDate)}</Pill>
            <Pill icon={MapPin}>{pluralise(data.stopCount, 'city', 'cities')}</Pill>
            <Pill icon={Sparkles}>
              {pluralise(data.activityCount, 'activity', 'activities')}
            </Pill>
            <Pill icon={Eye}>{formatNumber(trip.viewCount)} views</Pill>
          </div>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {copyError && (
          <Alert tone="error" title="That trip could not be copied" className="mb-6">
            {copyError}
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <section aria-labelledby="itinerary-heading" className="order-2 lg:order-1">
            <h2 id="itinerary-heading" className="font-display text-xl text-ink-900">
              Day by day
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {loading
                ? 'Loading the itinerary…'
                : `${pluralise(days.length, 'day')} on the ground, exactly as it was planned.`}
            </p>

            <div className="mt-5 space-y-3">
              {loading
                ? Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-3xl bg-canvas-deep" />
                  ))
                : days.map((day) => (
                    <DayRow key={day.date} day={day} currency={data.budget.currency} />
                  ))}
            </div>
          </section>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
            {loading ? (
              <div className="h-72 animate-pulse rounded-3xl bg-canvas-deep" />
            ) : (
              <div className="space-y-4">
                <BudgetSummary budget={data.budget} />

                {owner && (
                  <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-5">
                    <Avatar user={owner} size="size-11" />
                    <div className="min-w-0">
                      <p className="text-xs text-ink-500">Planned by</p>
                      <p className="truncate font-medium text-ink-900">{owner.firstName}</p>
                      {(owner.city || owner.country) && (
                        <p className="truncate text-xs text-ink-500">
                          {[owner.city, owner.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
};

export default PublicTripPage;
