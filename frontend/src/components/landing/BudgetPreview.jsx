import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Sparkles,
  TrainFront,
  TrendingUp,
  Utensils,
  Wallet,
} from 'lucide-react';

import { Section, SectionHeading } from '../layout/Section.jsx';
import { Badge, Button } from '../ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

/* -------------------------------------------------------------------------
   Static sample figures.

   This band sells the budget engine, so it shows one rather than describing
   it. Nothing here is fetched — the numbers are invented and labelled as
   such — but the colours are the real `cat-*` tokens, so the mock and the
   live donut on /trips/:id/budget cannot drift apart on screen.
------------------------------------------------------------------------- */
const CATEGORIES = [
  { key: 'stay', label: 'Stay', amount: 1120, color: 'var(--color-cat-stay)', icon: BedDouble },
  {
    key: 'transport',
    label: 'Transport',
    amount: 640,
    color: 'var(--color-cat-transport)',
    icon: TrainFront,
  },
  {
    key: 'activities',
    label: 'Activities',
    amount: 520,
    color: 'var(--color-cat-activities)',
    icon: Sparkles,
  },
  { key: 'meals', label: 'Meals', amount: 320, color: 'var(--color-cat-meals)', icon: Utensils },
];

const TOTAL = CATEGORIES.reduce((sum, category) => sum + category.amount, 0);

/** Donut geometry. r=54 inside a 140 box leaves room for an 18px ring. */
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Each slice is one full circle wearing a dash long enough to cover its own
 * share, pushed round by the running total of everything before it. A 2px
 * bite out of every dash is what separates the slices — cheaper than drawing
 * arc paths and it survives any change to the amounts above.
 */
let cursor = 0;
const SLICES = CATEGORIES.map((category) => {
  const length = (category.amount / TOTAL) * CIRCUMFERENCE;
  const slice = {
    ...category,
    length,
    offset: cursor,
    share: Math.round((category.amount / TOTAL) * 100),
  };
  cursor += length;
  return slice;
});

/** Per-day rows. `split` is in percent and follows CATEGORIES order. */
const DAYS = [
  { key: 'd4', label: 'Day 4 · Kyoto', amount: 186, split: [46, 14, 26, 14] },
  { key: 'd5', label: 'Day 5 · Nara', amount: 142, split: [52, 22, 12, 14] },
  { key: 'd6', label: 'Day 6 · Osaka', amount: 318, split: [30, 12, 46, 12], over: true },
];

const POINTS = [
  { icon: Wallet, text: 'Stays, transfers and activities land in the right category on their own.' },
  { icon: TrendingUp, text: 'The total moves the moment you add, reorder or delete something.' },
  { icon: AlertTriangle, text: 'Days that run past your cap are flagged before you book anything.' },
];

const money = (value) => `$${value.toLocaleString('en-US')}`;

/**
 * Copy on the left, a working-looking budget on the right.
 *
 * The chart is hand-rolled SVG on purpose: there is no chart library in this
 * project and a marketing panel is not a good enough reason to add one.
 */
export const BudgetPreview = () => (
  <Section id="budget" tone="inset" className="scroll-mt-24">
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHeading
          eyebrow="Budget engine"
          title="Watch the cost add up as you plan"
          sub="You should not have to finish an itinerary to find out what it costs. Every stop, day and activity feeds one running breakdown, so the number you see is the number you are about to spend."
        />

        <ul className="mt-10 flex flex-col gap-4">
          {POINTS.map((point) => (
            <li key={point.text} className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-brand-500">
                <point.icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm leading-6 text-ink-700">{point.text}</span>
            </li>
          ))}
        </ul>

        <Button
          to={ROUTES.trips}
          variant="primary"
          className="mt-10"
          rightIcon={<ArrowRight className="size-4" aria-hidden />}
        >
          See a live breakdown
        </Button>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-500">Sample trip</p>
            <p className="mt-2 font-display text-xl leading-none uppercase text-ink-900">
              Kyoto → Osaka
            </p>
            <p className="mt-2 text-xs text-ink-500">14 days · 2 travellers · USD</p>
          </div>
          <Badge tone="brand">On track</Badge>
        </div>

        <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:gap-8">
          <svg
            viewBox="0 0 140 140"
            className="size-40 shrink-0"
            role="img"
            aria-label={`Sample budget of ${money(TOTAL)} split across ${SLICES.map(
              (slice) => `${slice.label} ${slice.share} percent`
            ).join(', ')}`}
          >
            <g transform="rotate(-90 70 70)">
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke="var(--color-canvas-deep)"
                strokeWidth="18"
              />
              {SLICES.map((slice) => (
                <circle
                  key={slice.key}
                  cx="70"
                  cy="70"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={`${slice.length - 2} ${CIRCUMFERENCE - slice.length + 2}`}
                  strokeDashoffset={-slice.offset}
                />
              ))}
            </g>
            <text
              x="70"
              y="68"
              textAnchor="middle"
              className="fill-ink-900 font-display text-[27px]"
            >
              {money(TOTAL)}
            </text>
            <text
              x="70"
              y="86"
              textAnchor="middle"
              className="fill-ink-500 font-sans text-[8px] font-semibold tracking-[0.14em] uppercase"
            >
              Estimated total
            </text>
          </svg>

          <ul className="flex w-full flex-col gap-3">
            {SLICES.map((slice) => (
              <li key={slice.key} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-xl border border-line bg-inset"
                  style={{ color: slice.color }}
                >
                  <slice.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{slice.label}</span>
                <span className="text-xs text-ink-500 tabular-nums">{slice.share}%</span>
                <span className="w-16 text-right font-display text-base text-ink-900">
                  {money(slice.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 border-t border-line-soft pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow text-ink-500">Cost per day</p>
            <p className="text-xs text-ink-500">Cap $220</p>
          </div>

          <ul className="mt-4 flex flex-col gap-3.5">
            {DAYS.map((day) => (
              <li key={day.key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs text-ink-700 sm:w-28">
                  {day.label}
                </span>
                <span
                  aria-hidden
                  className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas-deep"
                >
                  {day.split.map((percent, index) => (
                    <span
                      key={CATEGORIES[index].key}
                      style={{ width: `${percent}%`, background: CATEGORIES[index].color }}
                    />
                  ))}
                </span>
                <span
                  className={cn(
                    'w-14 shrink-0 text-right font-display text-base',
                    day.over ? 'text-ember-500' : 'text-ink-900'
                  )}
                >
                  {money(day.amount)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-ember-100 bg-ember-50 px-3.5 py-2.5 text-xs leading-5 text-ember-700">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Day 6 runs $98 over your daily cap — the museum pass and the kaiseki dinner land on
            the same day.
          </p>
        </div>

        <p className="mt-4 text-[11px] text-ink-300">Illustrative figures.</p>
      </div>
    </div>
  </Section>
);
