import { useEffect, useState } from 'react';
import { Check, Copy, Globe, Link2, Lock } from 'lucide-react';

import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { ROUTES } from '../../lib/constants.js';
import { formatDateRange } from '../../lib/dates.js';
import { openShare, tripShareMessage, whatsappShareUrl } from '../../lib/share.js';
import { Alert, Button, ConfirmDialog } from '../../components/ui/index.js';

/**
 * lucide has no WhatsApp mark — its brand icons were split out into a separate
 * package we are not adding for one glyph. This is the official silhouette,
 * inlined, inheriting `currentColor` so the button controls it.
 */
const WhatsAppGlyph = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01c-1.52 0-3.02-.41-4.32-1.18l-.31-.18-3.21.84.86-3.13-.2-.32a8.22 8.22 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
  </svg>
);

/**
 * Publish / unpublish the itinerary and hand back the link.
 *
 * Both writes answer with the new visibility, so the parent patches its copy of
 * the trip from the response — refetching the whole itinerary to learn one
 * boolean would blank the day list for no reason.
 */
export const ShareCard = ({ tripId, trip, isPublic, publicSlug, onVisibilityChange }) => {
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

  const message = tripShareMessage({
    name: trip?.name,
    cityCount: trip?.stops?.length ?? trip?.stopCount,
    dateRange: trip?.startDate ? formatDateRange(trip.startDate, trip.endDate) : '',
  });

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
            {/* WhatsApp is where a plan actually gets sent to the people on it,
                so it is a first-class button rather than an icon in an overflow
                menu. It carries WhatsApp's own green — the one place on this
                palette a third-party brand colour is correct, because a
                forest-green WhatsApp button is not recognisable as one. */}
            <Button
              variant="outline"
              onClick={() => openShare(whatsappShareUrl({ message, url }))}
              leftIcon={<WhatsAppGlyph />}
              className="border-[#25D366]/40 text-[#128C7E] hover:border-[#25D366] hover:bg-[#25D366]/10"
            >
              WhatsApp
            </Button>
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
