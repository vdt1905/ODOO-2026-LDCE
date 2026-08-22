import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { FullPageLoader } from '../ui/Spinner.jsx';

/**
 * Client-side guards are UX only — the API re-checks ownership on every
 * request. They exist so a signed-out user never sees an empty dashboard flash.
 */

export const ProtectedRoute = () => {
  const { user, status } = useAuthStore();
  const location = useLocation();

  if (status !== 'ready') return <FullPageLoader label="Checking your session" />;

  if (!user) {
    // Remember where they were headed so login can send them back.
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        replace
      />
    );
  }

  return <Outlet />;
};

/** Keeps signed-in users off /login and /register. */
export const GuestRoute = () => {
  const { user, status } = useAuthStore();

  if (status !== 'ready') return <FullPageLoader label="Loading" />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, status } = useAuthStore();

  if (status !== 'ready') return <FullPageLoader label="Loading" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
};
