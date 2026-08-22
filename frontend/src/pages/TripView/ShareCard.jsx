import { useEffect, useState } from 'react';
import { Check, Copy, Globe, Link2, Lock } from 'lucide-react';

import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { ROUTES } from '../../lib/constants.js';
import { Alert, Button, ConfirmDialog } from '../../components/ui/index.js';

/**
 * Publish / unpublish the itinerary and hand back the link.
 *
 * Both writes answer with the new visibility, so the parent patches its copy of
 * the trip from the response — refetching the whole itinerary to learn one
 * boolean would blank the day list for no reason.
 */
export const ShareCard = ({ tripId, isPublic, publicSlug, onVisibilityChange }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmingUnshare, setConfirmingUnshare] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const path = publicSlug ? ROUTES.publicTrip(publicSlug) : '';
  // Absolute, because the point of this box is to be pasted somewhere else.
  const url = path ? `${window.location.origin}${path}` : '';

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await tripApi.share(tripId);
      onVisibilityChange({ isPublic: result.isPublic, publicSlug: result.publicSlug });
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  const unshare = async () => {
    setBusy(true);
    setError(null);
    try {
      await tripApi.unshare(tripId);
      // The server keeps the slug on unshare, so hold on to it rather than
      // nulling it — publishing again restores the very same URL.
      onVisibilityChange({ isPublic: false, publicSlug });
      setConfirmingUnshare(false);
    } catch (caught) {
      setError(toApiError(caught).message);
      setConfirmingUnshare(false);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      // Undefined outside a secure context, which the try/catch also covers.
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError('Could not reach the clipboard. Select the link and copy it manually.');
    }
  };

  return (
    <section
      aria-label="Sharing"
      className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink-900">
            {isPublic ? (
              <Globe className="size-5 text-brand-500" aria-hidden />
            ) : (
              <Lock className="size-5 text-ink-300" aria-hidden />
            )}
            {isPublic ? 'Shared publicly' : 'Private to you'}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">
            {isPublic
              ? 'Anyone with the link can read this itinerary and copy it onto their own account.'
              : 'Publish it to get a link anyone can open — no account needed to read it.'}
          </p>
        </div>

        {!isPublic && (
          <Button onClick={publish} loading={busy} leftIcon={<Globe className="size-4" />}>
            Publish
          </Button>
        )}
      </div>

      {isPublic && url && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-inset px-4 py-2.5">
            <Link2 className="size-4 shrink-0 text-ink-300" aria-hidden />
            <span className="truncate text-sm text-ink-700">{url}</span>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={copy}
              leftIcon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingUnshare(true)} disabled={busy}>
              Unshare
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <ConfirmDialog
        open={confirmingUnshare}
        loading={busy}
        title="Stop sharing this trip?"
        description="The link stops working straight away. Publishing again restores the same URL, so anyone who saved it gets back in."
        confirmLabel="Unshare"
        onConfirm={unshare}
        onCancel={() => {
          if (!busy) setConfirmingUnshare(false);
        }}
      />
    </section>
  );
};
