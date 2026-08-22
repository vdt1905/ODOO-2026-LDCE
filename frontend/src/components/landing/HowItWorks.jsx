import { CalendarRange, ListChecks, MapPinned, Share2 } from 'lucide-react';

import { Section, SectionHeading } from '../layout/Section.jsx';
import { cn } from '../../lib/cn.js';

const STEPS = [
  {
    icon: CalendarRange,
    title: 'Name the trip',
    body: 'Dates, a cover photo and a one-line intent. Ninety seconds of setup.',
  },
  {
    icon: MapPinned,
    title: 'Drop the stops',
    body: 'Search cities, pin them on the route, and reorder until the flow makes sense.',
  },
  {
    icon: ListChecks,
    title: 'Fill the days',
    body: 'Add activities with a time and a cost. The budget updates as you go.',
  },
  {
    icon: Share2,
    title: 'Share the plan',
    body: 'One public link. Friends can read it, copy it, and make it theirs.',
  },
];

/**
 * The numbered walkthrough, second band on the marketing page.
 *
 * The step number is the editorial detail: huge Anton in brand-100, sitting
 * behind the title rather than in a badge, so it reads like a printed page
 * number. It starts below the icon row on purpose — that band belongs to the
 * dashed connector, which runs from one step's icon to the next on desktop.
 * The icon tiles carry `bg-surface`, the band's own ground, so they mask the
 * rule instead of sitting on top of a visible line.
 */
export const HowItWorks = () => (
  <Section id="how-it-works" tone="surface" className="scroll-mt-24">
    <SectionHeading
      eyebrow="How it works"
      title="Four steps from idea to itinerary"
      sub="Most planning falls apart between the tabs — a map here, a spreadsheet there. TRIPORA keeps stops, days, activities and money in one structure you can hand to someone else."
    />

    <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute top-9 right-0 font-display text-[4.5rem] leading-none text-brand-100 select-none sm:text-[5.5rem]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Connector to the next step. Absolute, so it never affects the
              grid's own measure; the trailing -right-6 lands it exactly at
              the next column's icon because the grid gap there is 1.5rem. */}
          <span
            aria-hidden
            className={cn(
              'absolute top-7 left-16 -right-6 hidden border-t border-dashed border-line-dashed lg:block',
              index === STEPS.length - 1 && 'lg:hidden'
            )}
          />

          <span className="relative grid size-14 place-items-center rounded-2xl border border-line bg-surface text-brand-500">
            <step.icon className="size-6" aria-hidden />
          </span>

          <h3 className="relative mt-6 text-[1.375rem] leading-none uppercase text-ink-900">
            {step.title}
          </h3>
          <p className="relative mt-3 max-w-[36ch] text-sm leading-6 text-ink-700">{step.body}</p>
        </li>
      ))}
    </ol>
  </Section>
);
