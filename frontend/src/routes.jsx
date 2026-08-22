import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout.jsx';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/layout/RouteGuards.jsx';
import { ROUTES } from './lib/constants.js';
import LandingPage from './pages/Landing/index.jsx';
import LoginPage from './pages/Login/index.jsx';
import RegisterPage from './pages/Register/index.jsx';
import ForgotPasswordPage from './pages/ForgotPassword/index.jsx';
import ResetPasswordPage from './pages/ResetPassword/index.jsx';
import TripsPage from './pages/Trips/index.jsx';
import CreateTripPage from './pages/CreateTrip/index.jsx';
import ItineraryBuilderPage from './pages/ItineraryBuilder/index.jsx';
import ItineraryViewPage from './pages/ItineraryView/index.jsx';
import BudgetPage from './pages/Budget/index.jsx';
import CalendarPage from './pages/Calendar/index.jsx';
import TripMembersPage from './pages/TripMembers/index.jsx';
import CitySearchPage from './pages/CitySearch/index.jsx';
import ActivitySearchPage from './pages/ActivitySearch/index.jsx';
import CommunityPage from './pages/Community/index.jsx';
import ProfilePage from './pages/Profile/index.jsx';
import AdminPage from './pages/Admin/index.jsx';
import PublicTripPage from './pages/PublicTrip/index.jsx';
import NotFoundPage from './pages/NotFound/index.jsx';

export const AppRoutes = () => (
  <Routes>
    <Route element={<GuestRoute />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
    </Route>

    <Route path={ROUTES.publicTrip} element={<PublicTripPage />} />

    <Route element={<MainLayout />}>
      <Route index element={<LandingPage />} />
      <Route path={ROUTES.cities} element={<CitySearchPage />} />
      <Route path={ROUTES.activities} element={<ActivitySearchPage />} />
      <Route path={ROUTES.community} element={<CommunityPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.trips} element={<TripsPage />} />
        <Route path={ROUTES.newTrip} element={<CreateTripPage />} />
        <Route path={ROUTES.tripBuild} element={<ItineraryBuilderPage />} />
        <Route path={ROUTES.tripBudget} element={<BudgetPage />} />
        <Route path={ROUTES.tripCalendar} element={<CalendarPage />} />
        <Route path={ROUTES.tripMembers} element={<TripMembersPage />} />
        <Route path={ROUTES.trip} element={<ItineraryViewPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path={ROUTES.admin} element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
