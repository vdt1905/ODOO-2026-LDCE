import { useAuthStore } from '../../store/authStore.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Hero } from '../../components/landing/Hero.jsx';
import { DestinationRail } from '../../components/landing/DestinationRail.jsx';
import { HowItWorks } from '../../components/landing/HowItWorks.jsx';
import { BudgetPreview } from '../../components/landing/BudgetPreview.jsx';
import { CtaBand } from '../../components/landing/CtaBand.jsx';
import DashboardPage from '../Dashboard/index.jsx';

/**
 * `/` is two screens wearing one route.
 *
 * Signed out it is the marketing page — the pitch, the destinations, how it
 * works. Signed in it becomes the dashboard from mockup screen 3, because a
 * returning user wants their trips, not the pitch they already accepted.
 */
const MarketingPage = () => {
  usePageTitle('Plan the trip, not the spreadsheet');

  return (
    <>
      <Hero />
      <DestinationRail />
      <HowItWorks />
      <BudgetPreview />
      <CtaBand />
    </>
  );
};

const LandingPage = () => {
  const user = useAuthStore((s) => s.user);

  return user ? <DashboardPage /> : <MarketingPage />;
};

export default LandingPage;
