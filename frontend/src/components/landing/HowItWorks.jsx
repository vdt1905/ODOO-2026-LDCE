import { CalendarRange, MapPinned, Share2, Wallet } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

const STEPS = [
  {
    icon: CalendarRange,
    title: 'Start with the dates',
    body: 'Name the trip, set a window, and give it a budget ceiling if you have one.',
  },
  {
    icon: MapPinned,
    title: 'Stack up the cities',
    body: 'Add a stop per city with its own dates, then drag them into the order you will travel.',
  },
  {
    icon: Wallet,
    title: 'Watch the cost build',
    body: 'Every activity, night and transfer lands in a running breakdown — no spreadsheet.',
  },
  {
    icon: Share2,
    title: 'Send one link',
    body: 'Publish a read-only page. Anyone can open it, and copy the whole trip in a click.',
  },
];

export const HowItWorks = () => (
  <section className="border-y border-line bg-canvas-deep">
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-xl">
        <Badge tone="moss">How it works</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Four steps from idea to itinerary
        </h2>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-3xl border border-line bg-surface p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <step.icon className="size-5" aria-hidden />
              </span>
              <span className="font-display text-3xl font-bold text-canvas-deep">
                0{index + 1}
              </span>
            </div>

            <h3 className="mt-5 font-display text-base font-semibold text-ink-900">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
