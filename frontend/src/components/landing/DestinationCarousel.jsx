import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, TrendingUp, WalletCards } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { ROUTES, gradientFor } from '../../lib/constants.js';
import { usePopularCities } from '../../hooks/usePopularCities.js';
import { costLabel, popularityLabel } from './cityLabels.js';

/**
 * The closing destination carousel — one big photograph at a time, advancing on
 * its own.
 *
 * A four-up grid of small cards is what the page already opens with. Ending on
 * the same shape would say nothing new, so this is the opposite treatment: a
 * single 16:9 plate with the city set in Anton across it, the way a travel
 * magazine closes a feature.
 *
 * Autoplay rules, in the order they matter:
 *   · it stops while the pointer is over the carousel, while anything inside it
 *     has keyboard focus, and while the tab is hidden — an animation running in
 *     a background tab is pure battery;
 *   · it never starts at all under `prefers-reduced-motion`, where a slideshow
 *     that moves without being asked is exactly the thing the setting is for;
 *   · a manual arrow or dot resets the clock rather than fighting it, so a slide
 *     you just chose does not vanish half a second later.
 *
 * The slides are a translated track rather than one swapped image so the motion
 * reads as a swipe, and every slide stays in the DOM for the screen reader with
 * `aria-hidden` on the ones off screen.
 */

const INTERVAL = 5000;
const SLIDES = 6;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const DestinationCarousel = () => {
  const navigate = useNavigate();
  const { cities, loading } = usePopularCities(SLIDES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const slides = cities.slice(0, SLIDES);
  const count = slides.length;

  // Any manual move goes through this so the autoplay timer restarts from it —
  // the effect below depends on `index`, so setting it re-arms the interval.
  const go = useCallback(
    (next) => setIndex((current) => (count ? ((next ?? current + 1) % count + count) % count : 0)),
    [count]
  );

  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion()) return undefined;

    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(timer);
  }, [paused, count, index]);

  // A slideshow ticking in a background tab is wasted work.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    // 48px is far enough that a tap on the plate is never read as a swipe.
    if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1));
  };

  if (loading || !count) {
    return (
      <section className="section-tight bg-canvas">
        <div className="shell">
          <div className="aspect-16/9 w-full animate-pulse rounded-2xl bg-canvas-deep sm:aspect-21/9" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="section-tight bg-canvas"
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="shell">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-brand-500">Where people are going</p>
            <h2 className="section-title mt-2.5 text-ink-900">Pick a first stop</h2>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.cities)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Browse all cities
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl border border-line bg-brand-700"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((city, slide) => (
              <article
                key={city._id || city.name}
                aria-hidden={slide !== index}
                aria-roledescription="slide"
                aria-label={`${slide + 1} of ${count}: ${city.name}, ${city.country}`}
                className="relative aspect-16/9 w-full shrink-0 sm:aspect-21/9"
              >
                {city.imageUrl ? (
                  <img
                    src={city.imageUrl}
                    alt=""
                    loading={slide === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div
                    className={cn('absolute inset-0 bg-gradient-to-br', gradientFor(city.name))}
                  />
                )}

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(12,17,13,0.86) 0%, rgba(12,17,13,0.52) 46%, rgba(12,17,13,0.12) 100%)',
                  }}
                />

                <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 lg:p-12">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded border border-white/30 px-2 py-1 text-[10.5px] font-semibold tracking-[0.1em] text-white/85 uppercase">
                    <MapPin className="size-3" aria-hidden />
                    {city.region}
                  </span>

                  <h3 className="mt-3 font-display-caps text-[clamp(2rem,6vw,4.5rem)] leading-[0.9] text-canvas">
                    {city.name}
                  </h3>

                  <p className="mt-1.5 text-sm font-medium text-white/75">{city.country}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-semibold text-white/85">
                    <span className="inline-flex items-center gap-1.5">
                      <WalletCards className="size-3.5 text-brand-200" aria-hidden />
                      {costLabel(city.costIndex ?? 50)} · {city.costIndex ?? 50}/100
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="size-3.5 text-ember-300" aria-hidden />
                      {popularityLabel(city.popularity ?? 50)}
                    </span>
                  </div>

                  <button
                    type="button"
                    tabIndex={slide === index ? 0 : -1}
                    onClick={() =>
                      navigate(`${ROUTES.cities}?search=${encodeURIComponent(city.name)}`)
                    }
                    className="mt-6 inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-white px-4 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-brand-50"
                  >
                    Plan a stop here
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Controls sit on the plate rather than beside it — the photograph is
              the whole component, and a control tray underneath would push the
              next section down for no reason. */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2 sm:right-6 sm:bottom-6">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous destination"
              className="grid size-9 place-items-center rounded-lg border border-white/30 bg-ink-900/30 text-white backdrop-blur-sm transition-colors hover:bg-ink-900/55"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next destination"
              className="grid size-9 place-items-center rounded-lg border border-white/30 bg-ink-900/30 text-white backdrop-blur-sm transition-colors hover:bg-ink-900/55"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          {/* Progress dots. The active one stretches into a bar so the position
              in the set is readable at a glance, not just by colour. */}
          <div className="absolute bottom-5 left-6 flex items-center gap-1.5 sm:left-10 lg:left-12">
            {slides.map((city, slide) => (
              <button
                key={city._id || city.name}
                type="button"
                onClick={() => go(slide)}
                aria-label={`Go to ${city.name}`}
                aria-current={slide === index}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  slide === index ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
