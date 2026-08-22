import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { useAuthStore } from '../../store/authStore.js';

/**
 * Shell for every page that has the site chrome.
 * The landing page gets a transparent nav floating over its hero; every other
 * page gets a solid nav and top padding so content clears it.
 */
export const MainLayout = () => {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const isLanding = pathname === '/' && !user;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar floating={isLanding} />
      <main className={isLanding ? 'flex-1' : 'flex-1 pt-24'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
