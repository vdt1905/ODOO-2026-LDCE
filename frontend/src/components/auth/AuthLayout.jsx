import { Link } from 'react-router-dom';
import { ArrowLeft, Link2, Plane, Route, Wallet } from 'lucide-react';

import { BANNERS, ROUTES } from '../../lib/constants.js';
import { Logo } from '../ui/Logo.jsx';

/**
 * The auth screens, as a boarding pass.
 *
 * The version this replaces had the right idea and the wrong build: a dark
 * column and a white column butted together with a dotted line between them,
 * which reads as two panels sharing a border rather than one printed object.
 * Three things fix that here.
 *
 *   · **A header strip across the full width.** One dark band spanning both
 *     columns is what makes the card read as a single ticket — it is the piece
 *     that says "these two halves came off the same printer". Without it the
 *     seam is the loudest thing on the card.
 *
 *   · **The stub is laid out, not stretched.** It was `justify-between`, so on
 *     a tall card the three proof lines drifted into the middle of a field of
 *     green with a hole above them. Now the content flows from the top and a
 *     single monospace footer is pinned to the bottom, the way a real stub
 *     prints its reference.
 *
 *   · **The seam is drawn, not implied.** A dashed rule plus a notch at each
 *     end. Real ticket notches need a CSS mask, and a mask would take the
 *     border and the white body with it — so the notches are drawn as small
 *     rings on the dark side, which is the part that sells the effect.
 *
 * The overriding constraint stays: it must FIT. The shell is measured against
 * `svh`, the stub never scrolls, and only the form column gets `overflow-y-auto`
 * for the one screen that genuinely cannot fit — signup on a short laptop.
 *
 * Props are unchanged — `eyebrow`, `title`, `subtitle`, `footer`, `wide` — so
 * Login, Register, ForgotPassword and ResetPassword did not have to move.
 */

/** What the stub promises. Three lines, one icon each. */
const PROOF = [
  { Icon: Route, label: 'Multi-city itineraries' },
  { Icon: Wallet, label: 'A live, per-day budget' },
  { Icon: Link2, label: 'One link to share it' },
];

/** The tear line. Dashes in a gradient, so it stays crisp at any height. */
const SEAM =
  'bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.55)_0_5px,transparent_5px_12px)]';

export const AuthLayout = ({ eyebrow, title, subtitle, footer, wide = false, children }) => (
  <div className="relative isolate flex h-svh flex-col overflow-hidden">
    <img
      src={BANNERS.trips}
      alt=""
      aria-hidden
      className="fixed inset-0 -z-20 size-full object-cover"
    />
    <div
      className="fixed inset-0 -z-10"
      style={{
        background:
          'linear-gradient(180deg, rgba(14,19,15,0.86) 0%, rgba(14,19,15,0.58) 45%, rgba(14,19,15,0.9) 100%)',
      }}
    />

    <header className="shell flex h-14 shrink-0 items-center justify-end">
      <Link
        to={ROUTES.landing}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back home
      </Link>
    </header>

    <main className="shell flex min-h-0 flex-1 items-center justify-center pb-6">
      <div
        className={[
          'flex max-h-full w-full flex-col overflow-hidden rounded-xl',
          'border border-white/12 bg-surface shadow-[0_28px_70px_-30px_rgba(6,10,7,0.9)]',
          wide ? 'max-w-3xl' : 'max-w-[38rem]',
        ].join(' ')}
      >
        {/* ---- The strip that makes it one ticket ----------------------- */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-brand-700 px-5 py-2.5">
          <Logo tone="light" className="[&_img]:h-5" />
          <p className="font-mono text-[9.5px] tracking-[0.22em] text-white/45 uppercase">
            Boarding pass
          </p>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* ---- Stub -------------------------------------------------- */}
          <aside className="relative hidden flex-col bg-brand-500 px-5 py-6 text-canvas lg:flex">
            {/* Route line first: it is the ticket's most recognisable mark, so
                it earns the top of the column rather than being buried. */}
            <div aria-hidden className="flex items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full border border-brand-200" />
              <span className="h-px flex-1 bg-[repeating-linear-gradient(to_right,rgba(200,210,192,0.6)_0_4px,transparent_4px_9px)]" />
              <Plane className="size-3.5 shrink-0 -rotate-45 text-brand-200" />
              <span className="h-px flex-1 bg-[repeating-linear-gradient(to_right,rgba(200,210,192,0.6)_0_4px,transparent_4px_9px)]" />
              <span className="size-1.5 shrink-0 rounded-full bg-brand-200" />
            </div>

            <p className="mt-5 font-display text-[1.45rem] leading-[1.05] text-canvas">
              Every stop.
              <br />
              Every cost.
              <br />
              One plan.
            </p>

            <ul className="mt-6 grid gap-2.5">
              {PROOF.map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-px size-3.5 shrink-0 text-brand-200" aria-hidden />
                  <span className="text-[11.5px] leading-snug font-medium text-white/85">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/12 pt-4">
              {[
                ['Gate', '30 cities'],
                ['Seat', '01A'],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="font-mono text-[9px] tracking-[0.16em] text-white/40 uppercase">
                    {term}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-white/80">{value}</dd>
                </div>
              ))}
            </dl>

            {/* The seam, with a notch punched at each end. */}
            <span aria-hidden className={`absolute inset-y-4 right-0 w-px ${SEAM}`} />
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 size-3 rounded-full border border-white/20 bg-brand-700"
            />
            <span
              aria-hidden
              className="absolute -right-1.5 -bottom-1.5 size-3 rounded-full border border-white/20 bg-surface"
            />
          </aside>

          {/* ---- Body -------------------------------------------------- */}
          <div className="min-w-0 overflow-y-auto bg-surface px-5 py-6 sm:px-8">
            <header>
              {eyebrow && <p className="eyebrow text-brand-500">{eyebrow}</p>}
              <h1 className="mt-1.5 font-display text-[1.6rem] leading-[1.05] text-ink-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-md text-[13px] leading-snug text-ink-700">{subtitle}</p>
              )}
            </header>

            <div className="mt-6">{children}</div>

            {footer && (
              <div className="mt-5 border-t border-line pt-4 text-xs text-ink-700">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
);
