import { Check } from 'lucide-react';

import { cn } from '../../lib/cn.js';

/**
 * The numbered stage markers shared by the Create Trip rail and its cards.
 *
 * Anton for the numeral — a figure is the one thing on this screen people scan
 * for, and the display face is what makes "1 · 2 · 3" read as a sequence rather
 * than as three unrelated labels. `cn` is plain clsx with no Tailwind merging,
 * so every size variant is written out whole instead of being overridden.
 */
const MARKER_TONES = {
  done: 'border-brand-500 bg-brand-500 text-white',
  current: 'border-brand-500 bg-brand-50 text-brand-600',
  todo: 'border-line-strong bg-canvas-deep text-ink-300',
};

const MARKER_SIZES = {
  sm: 'size-9 text-[15px]',
  md: 'size-11 text-xl',
};

const CHECK_SIZES = {
  sm: 'size-4',
  md: 'size-5',
};

export const StepMarker = ({ step, state = 'todo', size = 'md', className }) => (
  <span
    aria-hidden
    className={cn(
      'grid shrink-0 place-items-center rounded-full border font-display leading-none transition-colors',
      MARKER_SIZES[size] || MARKER_SIZES.md,
      MARKER_TONES[state] || MARKER_TONES.todo,
      className
    )}
  >
    {state === 'done' ? <Check className={CHECK_SIZES[size] || CHECK_SIZES.md} /> : step}
  </span>
);

/**
 * One stage of the form: a numbered marker, an Anton title, a plain-English
 * line saying what the stage is for, then the controls.
 *
 * Every stage is the same card — same radius, same 1px edge, same p-5/p-7
 * padding — so the eye reads the numbers as progress instead of re-learning a
 * new surface at every scroll position.
 */
export const StepCard = ({
  step,
  title,
  sub,
  state = 'current',
  action,
  children,
  className,
  id,
}) => (
  <section
    id={id}
    aria-labelledby={id ? `${id}-title` : undefined}
    className={cn('rounded-3xl border border-line bg-surface p-5 sm:p-7', className)}
  >
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
      <StepMarker step={step} state={state} />

      <div className="min-w-0 flex-1">
        <h2
          id={id ? `${id}-title` : undefined}
          className="font-display text-xl leading-none text-ink-900 uppercase sm:text-2xl"
        >
          {title}
        </h2>
        {sub && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">{sub}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>

    <div className="mt-6 sm:mt-7">{children}</div>
  </section>
);

/**
 * The "how far along am I" rail that opens the form.
 *
 * It is a summary, not a set of controls: the form is one page, so a step here
 * cannot be "navigated to". It answers the two questions the user actually has
 * — which parts are done, and what is left.
 */
export const StepRail = ({ steps, className }) => (
  <ol className={cn('grid gap-3 sm:grid-cols-3', className)}>
    {steps.map((step, index) => (
      <li
        key={step.title}
        aria-current={step.state === 'current' ? 'step' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
          step.state === 'current'
            ? 'border-brand-300 bg-brand-50'
            : step.state === 'done'
              ? 'border-line bg-surface'
              : 'border-line-soft bg-surface/60'
        )}
      >
        <StepMarker step={index + 1} state={step.state} size="sm" />
        <span className="min-w-0">
          <span className="block font-display text-sm leading-none text-ink-900 uppercase">
            {step.title}
          </span>
          <span className="mt-1.5 block truncate text-xs text-ink-500">{step.hint}</span>
        </span>
      </li>
    ))}
  </ol>
);
