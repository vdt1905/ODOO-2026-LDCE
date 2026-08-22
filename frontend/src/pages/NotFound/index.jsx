import { Compass } from 'lucide-react';
import { Button } from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const NotFoundPage = () => {
  usePageTitle('Page not found');

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-canvas-deep text-ink-500">
        <Compass className="size-6" aria-hidden />
      </span>

      <p className="mt-6 font-display text-6xl font-extrabold text-ink-900">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
        This route isn't on the map
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        The page you were looking for has moved, or never existed.
      </p>

      <Button to={ROUTES.landing} variant="dark" className="mt-8">
        Take me home
      </Button>
    </section>
  );
};

export default NotFoundPage;
