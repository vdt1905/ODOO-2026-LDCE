import { Link } from 'react-router-dom';
import { ArrowLeft, Quote } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { Logo } from '../ui/Logo.jsx';
import { HeroScene } from '../landing/HeroScene.jsx';

/**
 * Split shell for the auth screens: illustrated panel on the left, form on the
 * right. The panel collapses away below `lg` so the form owns small screens.
 *
 * `wide` gives the signup form room for its two-column grid.
 */
export const AuthLayout = ({ title, subtitle, footer, wide = false, children }) => (
  <div className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    {/* Illustrated panel */}
    <aside className="relative hidden overflow-hidden lg:block">
      <HeroScene className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/15 to-ink-900/30" />

      <div className="relative flex h-full flex-col justify-between p-10">
        <Logo tone="light" />

        <div className="max-w-sm">
          <Quote className="size-7 text-white/50" aria-hidden />
          <p className="mt-4 font-display text-2xl leading-snug font-semibold text-white">
            Three cities, eleven days, and a budget that finally added up.
          </p>
          <p className="mt-3 text-sm text-white/70">
            Everything you plan lands in one itinerary you can share with a single link.
          </p>
        </div>
      </div>
    </aside>

    {/* Form panel */}
    <main className="flex flex-col px-5 py-8 sm:px-10">
      <div className="flex items-center justify-between">
        <Logo className="lg:hidden" />
        <Link
          to={ROUTES.landing}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-8">
        <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
          <header className="text-center lg:text-left">
            <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          </header>

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-ink-500 lg:text-left">{footer}</div>
          )}
        </div>
      </div>
    </main>
  </div>
);
