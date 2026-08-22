import { Hero } from '../../components/landing/Hero.jsx';
import { DestinationRail } from '../../components/landing/DestinationRail.jsx';
import { HowItWorks } from '../../components/landing/HowItWorks.jsx';
import { BudgetPreview } from '../../components/landing/BudgetPreview.jsx';
import { CtaBand } from '../../components/landing/CtaBand.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';
import DashboardPage from '../Dashboard/index.jsx';

const LandingPage = () => {
  usePageTitle('Plan the trip, not the spreadsheet');
  const user = useAuthStore((state) => state.user);

  if (user) return <DashboardPage />;

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

export default LandingPage;
