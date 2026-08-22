import { AlertCircle, Compass, Loader2 } from 'lucide-react';
import { Button } from './Button.jsx';

export const LoadingState = ({ label = 'Loading your trip' }) => (
  <div className="grid min-h-56 place-items-center rounded-4xl border border-line bg-surface p-8 text-center shadow-soft">
    <div>
      <Loader2 className="mx-auto size-6 animate-spin text-clay-500" />
      <p className="mt-3 text-sm text-ink-500">{label}</p>
    </div>
  </div>
);

export const ErrorState = ({ error, retry }) => (
  <div className="rounded-4xl border border-clay-200 bg-clay-50 p-8 text-center">
    <AlertCircle className="mx-auto size-7 text-clay-600" />
    <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">We could not load this yet</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{error?.message || 'Please try again.'}</p>
    {retry && <Button className="mt-5" variant="outline" onClick={retry}>Try again</Button>}
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-4xl border border-dashed border-line bg-surface/70 p-8 text-center">
    <Compass className="mx-auto size-7 text-moss-600" />
    <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">{title}</h2>
    {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
