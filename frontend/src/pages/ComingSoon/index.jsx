import { Construction } from 'lucide-react';
import { Badge, Button } from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

/**
 * Honest placeholder for screens that are planned but not built yet, so nav
 * links never dead-end. Each one names the README phase that delivers it.
 */
export const ComingSoon = ({ title, phase, description }) => {
  usePageTitle(title);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-brand-50 text-brand-600">
        <Construction className="size-6" aria-hidden />
      </span>

      <Badge tone="neutral" className="mt-6">
        {phase}
      </Badge>

      <h1 className="mt-4 font-display text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to={ROUTES.landing} variant="dark">
          Back to home
        </Button>
        <Button to={ROUTES.register} variant="outline">
          Create an account
        </Button>
      </div>
    </section>
  );
};
