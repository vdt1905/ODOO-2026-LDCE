import { Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout.jsx';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards.jsx';
import { ROUTES } from './lib/constants.js';

import LandingPage from './pages/Landing/index.jsx';
import LoginPage from './pages/Login/index.jsx';
import RegisterPage from './pages/Register/index.jsx';
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

      <Route
        path={ROUTES.cities}
        element={
          <ComingSoon
            title="City search"
            phase="Phase 6 · Search"
            description="Search the catalog by name, country and region, then add a city straight to a trip."
          />
        }
      />
      <Route
        path={ROUTES.activities}
        element={
          <ComingSoon
            title="Activity search"
            phase="Phase 6 · Search"
            description="Filter things to do by type, cost and duration, and attach them to a stop."
          />
        }
      />
      <Route
        path={ROUTES.community}
        element={
          <ComingSoon
            title="Community"
            phase="Phase 8 · Bonus"
            description="A feed of published itineraries you can browse, open and copy."
          />
        }
      />

      {/* Signed-in only */}
      <Route element={<ProtectedRoute />}>
        <Route
          path={ROUTES.trips}
          element={
            <ComingSoon
              title="My trips"
              phase="Phase 3 · Trip CRUD"
              description="Your trips grouped into ongoing, upcoming and completed."
            />
          }
        />
        <Route
          path={ROUTES.newTrip}
          element={
            <ComingSoon
              title="Plan a new trip"
              phase="Phase 3 · Trip CRUD"
              description="Name it, set the dates, pick a cover, and start dropping in cities."
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
