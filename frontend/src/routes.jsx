import { Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout.jsx';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/layout/RouteGuards.jsx';
import { ROUTES } from './lib/constants.js';

import LandingPage from './pages/Landing/index.jsx';
import LoginPage from './pages/Login/index.jsx';
import RegisterPage from './pages/Register/index.jsx';
import ForgotPasswordPage from './pages/ForgotPassword/index.jsx';
import ResetPasswordPage from './pages/ResetPassword/index.jsx';
import CitiesPage from './pages/Cities/index.jsx';
import ActivitiesPage from './pages/Activities/index.jsx';
import CommunityPage from './pages/Community/index.jsx';
import PublicTripPage from './pages/PublicTrip/index.jsx';
import TripsPage from './pages/Trips/index.jsx';
import CreateTripPage from './pages/CreateTrip/index.jsx';
import AiTripPage from './pages/AiTrip/index.jsx';
import TripViewPage from './pages/TripView/index.jsx';
import TripBuilderPage from './pages/TripBuilder/index.jsx';
import TripBudgetPage from './pages/TripBudget/index.jsx';
import ProfilePage from './pages/Profile/index.jsx';
import AdminPage from './pages/Admin/index.jsx';
import NotFoundPage from './pages/NotFound/index.jsx';

/**
 * Route table for the whole app.
 * Auth screens render outside MainLayout — they own the full viewport.
 * Public auth recovery routes stay outside the site chrome as well.
 */
export const AppRoutes = () => (
  <Routes>
    {/* Auth — only reachable while signed out */}
    <Route element={<GuestRoute />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
    </Route>

    {/* Everything with site chrome */}
    <Route element={<MainLayout />}>
      <Route index element={<LandingPage />} />

      <Route path={ROUTES.cities} element={<CitiesPage />} />
      <Route path={ROUTES.activities} element={<ActivitiesPage />} />
      <Route path={ROUTES.community} element={<CommunityPage />} />

      {/* A shared itinerary. Public on purpose — the whole point of the link is
          that it works for someone with no account. */}
      <Route path="/t/:slug" element={<PublicTripPage />} />

      {/* Signed-in only */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.trips} element={<TripsPage />} />
        {/* Both static, so React Router ranks them above /trips/:id unaided. */}
        <Route path={ROUTES.newTrip} element={<CreateTripPage />} />
        <Route path={ROUTES.aiTrip} element={<AiTripPage />} />

        <Route path="/trips/:id" element={<TripViewPage />} />
        {/* Also the AI generator's redirect target, so it is load-bearing for
            more than the "Build" button on a trip card. */}
        <Route path="/trips/:id/build" element={<TripBuilderPage />} />
        <Route path="/trips/:id/budget" element={<TripBudgetPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
      </Route>

      {/* Admin sits behind its own guard. The page re-checks the role too —
          neither is security, the API is; both just avoid a broken screen. */}
      <Route element={<AdminRoute />}>
        <Route path={ROUTES.admin} element={<AdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
