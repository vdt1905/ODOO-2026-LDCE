/**
 * WhatsApp sharing, via WhatsApp's own share endpoint.
 *
 * There is no key, no SDK and no server call involved: `https://wa.me/?text=…`
 * is WhatsApp's public share API. Opening it hands the composed message to
 * whichever WhatsApp the visitor has — the desktop app, the web client, or the
 * native app on a phone — and lets THEM pick the recipient. That is the whole
 * integration, and it is the right one here: we never see who the trip was sent
 * to, and nothing breaks when a user has no WhatsApp installed (they land on
 * web.whatsapp.com and can scan in).
 *
 * `wa.me` is deliberate over `api.whatsapp.com/send`. Both work, but `wa.me` is
 * the short form WhatsApp documents for share links and it redirects correctly
 * on desktop, where `api.whatsapp.com` has historically bounced people to a
 * download page.
 */

const WA_ENDPOINT = 'https://wa.me/';

/**
 * Build the share URL.
 *
 * WhatsApp reads ONE `text` parameter — there is no separate title/url pair, so
 * the link has to be part of the text. It also renders a link preview only when
 * the URL is the last thing in the message, which is why the caller's URL is
 * always appended at the end rather than interpolated mid-sentence.
 */
export const whatsappShareUrl = ({ message, url }) => {
  const text = [message, url].filter(Boolean).join('\n\n');
  return `${WA_ENDPOINT}?text=${encodeURIComponent(text)}`;
};

/**
 * The message body for a trip.
 *
 * Kept short on purpose. WhatsApp collapses anything past roughly three lines
 * behind a "Read more", and a preview that opens collapsed reads as spam.
 */
export const tripShareMessage = ({ name, cityCount, dateRange }) => {
  const detail = [
    cityCount ? `${cityCount} ${cityCount === 1 ? 'city' : 'cities'}` : null,
    dateRange || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return [`*${name || 'My trip'}* — planned on TRIPORA`, detail].filter(Boolean).join('\n');
};

/**
 * Open a share URL in a new tab.
 *
 * `noopener` matters: without it the opened WhatsApp tab gets a handle on this
 * window through `window.opener` and can navigate it somewhere else.
 */
export const openShare = (url) => window.open(url, '_blank', 'noopener,noreferrer');
