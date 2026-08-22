import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Avatar, Badge } from '../../components/ui/index.js';
import { BANNERS } from '../../lib/constants.js';
import { formatDate } from '../../lib/dates.js';
import { useAuthStore } from '../../store/authStore.js';
import { useTripStats } from '../../hooks/useTrips.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { PhotoCard } from './PhotoCard.jsx';
import { ProfileForm } from './ProfileForm.jsx';
import { ProfileStats } from './ProfileStats.jsx';
import { SavedDestinations } from './SavedDestinations.jsx';

/** "Lisbon, Portugal" from whichever halves are filled in. */
const placeOf = (user) => [user.city, user.country].filter(Boolean).join(', ');

const ProfilePage = () => {
  usePageTitle('Your profile');

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const { stats, loading: statsLoading } = useTripStats();

  // ProtectedRoute normally settles the session before this mounts; this covers
  // a direct render while the refresh cookie is still being traded in.
  if (!user) {
    return (
      <>
        <PageHeader
          image={BANNERS.profile}
          kicker="Your account"
          title="Profile"
          sub={status === 'ready' ? 'Sign in to manage your account.' : 'Loading your account…'}
        />
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
          <div className="h-[118px] animate-pulse rounded-3xl bg-canvas-deep" />
          <div className="h-96 animate-pulse rounded-3xl bg-canvas-deep" />
        </div>
      </>
    );
  }

  const place = placeOf(user);

  return (
    <>
      <PageHeader
        image={BANNERS.profile}
        kicker="Your account"
        title={user.fullName || `${user.firstName} ${user.lastName}`.trim()}
        sub={
          place ||
          'Add a home city so your itineraries know where every trip starts from.'
        }
      >
        {/* Identity, not page content — the editable copies of all of this live
            in the cards below. */}
        <div className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-3xl border border-white/25 bg-white/12 px-4 py-3 backdrop-blur-md">
          <Avatar user={user} size="size-11" className="ring-2 ring-white/40" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-white/70">
              Travelling with us since {formatDate(user.createdAt)}
            </p>
          </div>
          {user.role === 'admin' && <Badge tone="glass">Admin</Badge>}
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <ProfileStats stats={stats} loading={statsLoading} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <ProfileForm user={user} />
          <PhotoCard user={user} />
        </div>

        <SavedDestinations ids={user.savedDestinations} />
      </div>
    </>
  );
};

export default ProfilePage;
