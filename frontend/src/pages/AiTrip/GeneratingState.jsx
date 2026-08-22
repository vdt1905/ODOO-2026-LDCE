import { useEffect, useState } from 'react';
import { Compass, MapPin, Route, Wallet } from 'lucide-react';

/**
 * What the model is doing, in the order it does it. The server builds the trip
 * shell, then the stops, then the per-day activities, then totals the costs —
 * so these are the real stages, not decoration.
 */
const STAGES = [
  { at: 0, Icon: Compass, label: 'Reading your brief' },
  { at: 6, Icon: MapPin, label: 'Choosing cities and splitting the dates' },
  { at: 14, Icon: Route, label: 'Filling in the day-by-day plan' },
  { at: 26, Icon: Wallet, label: 'Costing it against your budget' },
];

/**
 * The wait. Generation runs 10–30s normally and can reach ~60s when the server
 * retries a timeout, which is far too long for a bare spinner.
 *
 * The stages advance on elapsed time rather than on real progress — the API is
 * a single request with no progress channel. So the elapsed counter is shown
 * plainly and the copy never claims a percentage it cannot know.
 */
export const GeneratingState = ({ days }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // The last stage whose threshold we have passed.
  const current = STAGES.reduce((found, stage) => (elapsed >= stage.at ? stage : found), STAGES[0]);
  const slow = elapsed >= 35;

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-24">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-lg rounded-3xl border border-line bg-surface p-8 text-center sm:p-10"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand-50">
          <current.Icon className="size-7 animate-pulse text-brand-600" aria-hidden />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold text-ink-900">
          Building your {days}-day itinerary
        </h1>
        <p className="mt-2 text-sm text-ink-500">{current.label}…</p>

        <ol className="mt-8 space-y-2.5 text-left">
          {STAGES.map((stage) => {
            const done = elapsed >= stage.at && stage !== current;
            const active = stage === current;
            return (
              <li
                key={stage.label}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-brand-300 bg-brand-50 text-ink-900'
                    : done
                      ? 'border-line bg-canvas-deep text-ink-500'
                      : 'border-transparent text-ink-300'
                }`}
              >
                <stage.Icon className="size-4 shrink-0" aria-hidden />
                <span className={active ? 'font-semibold' : ''}>{stage.label}</span>
              </li>
            );
          })}
        </ol>

        <p className="mt-7 text-xs text-ink-500">
          {elapsed}s elapsed
          {slow && ' — still going. The planner retries once if the first attempt runs long.'}
        </p>
        {/* Accurate, not reassuring-sounding: the request runs on the server
            regardless, so leaving loses the redirect, not the trip. */}
        <p className="mt-1.5 text-xs text-ink-300">
          You can leave — the trip still gets saved, you just won't be dropped straight into it.
        </p>
      </div>
    </div>
  );
};
