import { Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout.jsx';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards.jsx';
import { ROUTES } from './lib/constants.js';

import LandingPage from './pages/Landing/index.jsx';
import LoginPage from './pages/Login/index.jsx';
import RegisterPage from './pages/Register/index.jsx';
import CitiesPage from './pages/Cities/index.jsx';
import ActivitiesPage from './pages/Activities/index.jsx';
import CommunityPage from './pages/Community/index.jsx';
import PublicTripPage from './pages/PublicTrip/index.jsx';
import TripsPage from './pages/Trips/index.jsx';
import CreateTripPage from './pages/CreateTrip/index.jsx';
import AiTripPage from './pages/AiTrip/index.jsx';
import NotFoundPage from './pages/NotFound/index.jsx';
import { ComingSoon } from './pages/ComingSoon/index.jsx';

/**
 * Route table for the whole app.
 * Auth screens render outside MainLayout — they own the full viewport.
 * Screens still to be built render <ComingSoon> so no link dead-ends.
 */
export const AppRoutes = () => (
  <Routes>
    {/* Auth — only reachable while signed out */}
    <Route element={<GuestRoute />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route
        path={ROUTES.forgotPassword}
        element={
          <ComingSoon
            title="Reset your password"
            phase="Phase 1 · Auth"
            description="The API already issues reset tokens. This screen wires them up next."
          />
        }
      />
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

        <Route
          path="/trips/:id"
          element={
            <ComingSoon
              title="Itinerary view"
              phase="Phase 5 · Budget & views"
              description="The day-by-day plan for this trip, with costs per day and per city."
            />
          }
        />
        <Route
          path="/trips/:id/build"
          element={
            <ComingSoon
              title="Itinerary builder"
              phase="Phase 4 · Builder"
              description="Add stops and activities, drag them into order, and watch the budget bar move."
            />
          }
        />
        <Route
          path="/trips/:id/budget"
          element={
            <ComingSoon
              title="Budget breakdown"
              phase="Phase 5 · Budget & views"
              description="Cost by category and by city, plus the days that go over your limit."
            />
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ComingSoon
              title="Profile & settings"
              phase="Phase 7 · Profile"
              description="Edit your details, upload a photo, and manage saved destinations."
            />
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
