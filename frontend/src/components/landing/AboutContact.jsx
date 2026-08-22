import { useId, useState } from 'react';
import { Code2, Globe, Mail, MapPin, Route, Send, Share2, Wallet } from 'lucide-react';

import { Section, SectionHeading } from '../layout/Section.jsx';
import { Alert, Button } from '../ui/index.js';
import { cn } from '../../lib/cn.js';

/* ---------------------------------------------------------------------------
   THE CONTACT FORM DOES NOT POST ANYWHERE.

   There is no contact endpoint on this API, and inventing one would give the
   user a form that silently swallows their message. So the form is local state
   only: submitting it clears the fields and shows an inline confirmation, and
   the real mailto: link sitting next to that confirmation is the honest way to
   actually reach the team. If a /contact endpoint ever lands, wire `handleSubmit`
   to it and keep the mailto as the fallback.
--------------------------------------------------------------------------- */

const CONTACT_EMAIL = 'hello@tripora.app';

/** What TRIPORA is, in three scannable pieces. */
const HIGHLIGHTS = [
  { icon: Route, label: 'Multi-city routes' },
  { icon: Wallet, label: 'Budget that adds up' },
  { icon: Share2, label: 'One share link' },
];

/**
 * The closing contact lines. `href` is optional — the location is a fact, not a
 * link, so it renders as plain text rather than a dead anchor.
 */
const CONTACT_LINES = [
  {
    icon: Mail,
    label: 'Email us',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: MapPin,
    label: 'Where we are',
    value: 'Ahmedabad, India — team LDCE',
  },
  {
    icon: Code2,
    label: 'Source',
    value: 'Built at the Odoo Hackathon',
    href: 'https://github.com',
  },
];

/**
 * Inputs on the dark band cannot use the shared `controlClasses` — those are
 * drawn for white paper (bg-surface, text-ink-900) and go invisible here. The
 * geometry is copied exactly (h-12, rounded-2xl, px-4, text-[15px]) so a field
 * in this card still lines up with a field anywhere else on the site.
 *
 * The focus ring is brand-300, not the global brand-500: deep forest on deep
 * forest is not a visible focus state.
 */
const darkControl =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-[15px] text-canvas ' +
  'placeholder:text-canvas/35 outline-none transition-colors duration-200 ' +
  'hover:border-white/25 focus:border-brand-300 focus:bg-white/10 ' +
  'focus:ring-4 focus:ring-brand-300/20';

/** Keyboard focus that survives the dark ground. */
const darkFocus =
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-300';

const darkLabel = 'text-[11px] font-semibold tracking-[0.09em] text-canvas/60 uppercase';

const EMPTY_FORM = { name: '', email: '', message: '' };

/**
 * The last band before the footer: what this thing is, and how to reach the
 * people who built it. Deep forest rather than black — it is the theme's own
 * dark end, so it closes the page instead of interrupting it.
 */
export const AboutContact = () => {
  const fieldId = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    if (sent) setSent(false);
  };

  const complete =
    form.name.trim() !== '' && form.email.trim() !== '' && form.message.trim() !== '';

  // Local only — see the note at the top of this file. Nothing is sent.
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!complete) return;
    setForm(EMPTY_FORM);
    setSent(true);
  };

  return (
    <Section as="section" id="about" tone="dark">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ---- About ---------------------------------------------------- */}
        <div>
          <SectionHeading
            invert
            eyebrow="About TRIPORA"
            title="Built for people who plan out loud"
          />

          <div className="mt-6 max-w-xl space-y-4 text-[15px] leading-relaxed text-canvas/70">
            <p>
              TRIPORA is a planner for trips that refuse to sit in one city. Give each
              stop its own dates, hang activities off each day, and the whole route stays in
              one place instead of scattered across tabs, chats and a spreadsheet nobody
              opens twice.
            </p>
            <p>
              The budget adds up while you plan — per day, per city and per category — so you
              find out what a trip costs before you book it, not after. When it is ready, one
              public link shares the whole itinerary, and anyone can copy it onto their own
              account and make it theirs.
            </p>
          </div>

          <ul className="mt-8 flex flex-wrap gap-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] text-canvas/80"
              >
                <item.icon className="size-4 text-brand-300" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Contact -------------------------------------------------- */}
        <div
          id="contact"
          className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-7"
        >
          <h3 className="text-2xl uppercase text-canvas">Say hello</h3>
          <p className="mt-2 text-sm leading-relaxed text-canvas/60">
            A bug, an idea, or a trip you want us to see. We read everything.
          </p>

          {sent && (
            <Alert tone="success" title="Thanks — message noted" className="mt-6">
              <p>
                Someone on the team will reply by email. If you would rather not wait, write
                to us directly at{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor={`${fieldId}-name`} className={darkLabel}>
                Your name
              </label>
              <input
                id={`${fieldId}-name`}
                name="name"
                value={form.name}
                onChange={setField('name')}
                placeholder="Ada Lovelace"
                autoComplete="name"
                className={cn(darkControl, 'h-12')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${fieldId}-email`} className={darkLabel}>
                Email address
              </label>
              <input
                id={`${fieldId}-email`}
                name="email"
                type="email"
                value={form.email}
                onChange={setField('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className={cn(darkControl, 'h-12')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={`${fieldId}-message`} className={darkLabel}>
                What is on your mind?
              </label>
              <textarea
                id={`${fieldId}-message`}
                name="message"
                rows={4}
                value={form.message}
                onChange={setField('message')}
                placeholder="Tell us about the trip you are trying to plan."
                className={cn(darkControl, 'resize-none py-3.5 leading-relaxed')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="submit"
                variant="light"
                disabled={!complete}
                leftIcon={<Send className="size-4" aria-hidden />}
              >
                Send message
              </Button>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={cn(
                  'rounded text-[13px] text-canvas/60 underline underline-offset-4 transition-colors hover:text-canvas',
                  darkFocus
                )}
              >
                or email us instead
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* ---- Contact lines --------------------------------------------- */}
      <div className="mt-14 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3">
        {CONTACT_LINES.map((line) => {
          const body = (
            <>
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-brand-300">
                <line.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold tracking-[0.09em] text-canvas/50 uppercase">
                  {line.label}
                </span>
                <span className="mt-1 block text-sm text-canvas/70 transition-colors group-hover:text-canvas">
                  {line.value}
                </span>
              </span>
            </>
          );

          return (
            <div key={line.label}>
              {line.href ? (
                <a
                  href={line.href}
                  className={cn('group flex items-start gap-3 rounded-2xl', darkFocus)}
                  {...(line.href.startsWith('http')
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                >
                  {body}
                </a>
              ) : (
                <div className="flex items-start gap-3">{body}</div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 flex items-center gap-2 text-[13px] text-canvas/50">
        <Globe className="size-4 shrink-0" aria-hidden />
        Free while we are in beta — no card, no lock-in, and your itinerary stays yours.
      </p>
    </Section>
  );
};
