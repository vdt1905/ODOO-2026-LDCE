import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { ChromeProvider } from './chrome.jsx';
import { useChrome } from './chromeContext.js';

/**
 * Shell for every page that carries the site chrome.
 *
 * Pages that open with a <PageHeader> (or the landing hero) put a photograph
 * behind the navbar, and those register themselves as immersive — the nav then
 * floats transparently over the image and only turns solid once you scroll.
 * Pages without one keep a solid nav, because white-on-transparent over cream
 * is invisible.
 *
 * <main> has no top padding: an immersive header provides its own clearance,
 * and a plain page gets it from the spacer below instead.
 */
const Shell = () => {
  const { immersive } = useChrome();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar floating={immersive} />
      <main className="flex-1">
        {!immersive && <div className="h-24" aria-hidden />}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const MainLayout = () => (
  <ChromeProvider>
    <Shell />
  </ChromeProvider>
);
