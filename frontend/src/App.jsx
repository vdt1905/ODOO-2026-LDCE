import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from './routes.jsx';
import { ScrollToTop } from './components/layout/ScrollToTop.jsx';
import { FullPageLoader } from './components/ui/Spinner.jsx';
import { DevSettings } from './components/dev/DevSettings.jsx';
import { useAuthStore } from './store/authStore.js';

const App = () => {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // Trades the httpOnly refresh cookie for an access token on first paint,
  // so a reload keeps you signed in.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'idle' || status === 'loading') {
    return <FullPageLoader label="Getting your trips ready" />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
      {/* Development affordance — remove before the final build. */}
      <DevSettings />
    </BrowserRouter>
  );
};

export default App;
