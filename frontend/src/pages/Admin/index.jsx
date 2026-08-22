import { ShieldOff } from 'lucide-react';

import { adminApi } from '../../api/admin.api.js';
import { BANNERS, ROUTES } from '../../lib/constants.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button, EmptyState } from '../../components/ui/index.js';
import { PopularActivities } from './PopularActivities.jsx';
import { PopularCities } from './PopularCities.jsx';
import { StatSections } from './StatSections.jsx';
import { TrendsChart } from './TrendsChart.jsx';
import { UserTable } from './UserTable.jsx';

const Header = ({ sub }) => (
  <PageHeader image={BANNERS.admin} kicker="Platform" title="Admin" sub={sub} />
);

/**
 * Analytics and user management.
 *
 * Guarded here as well as by AdminRoute in components/layout/RouteGuards.jsx:
 * that guard redirects, which is right when the link is reachable, but this
 * page must also explain itself if it is ever mounted without it. Neither is
 * security — every /admin endpoint re-checks the role server-side.
 */
const AdminPage = () => {
  usePageTitle('Admin');

  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const isAdmin = user?.role === 'admin';

  const { data: stats, loading, error } = useAsync(() => adminApi.stats(), ['stats'], {
    enabled: isAdmin,
  });

  if (status !== 'ready') {
    return (
      <>
        <Header sub="Checking your access…" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-64 animate-pulse rounded-3xl bg-canvas-deep" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header sub="This area is limited to administrators." />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <EmptyState
            icon={ShieldOff}
            title="You do not have access to this page"
            description="Admin tools are limited to accounts with the admin role. If you think that is wrong, ask another admin to update yours."
            action={
              <Button to={ROUTES.landing} size="lg">
                Back to your trips
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header sub="How TRIPORA is being used, and who is using it." />

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <StatSections stats={stats} loading={loading} error={error} />

        <TrendsChart />

        {/* Stacked rather than side by side: the activities panel already
            splits into a list and a type mix, and nesting that inside a half
            width column crushes both. */}
        <PopularCities limit={8} />
        <PopularActivities limit={8} />

        <UserTable currentUserId={user._id} />
      </div>
    </>
  );
};

export default AdminPage;
