import { cn } from '../../lib/cn.js';

/**
 * Shared field styling so inputs, textareas and selects stay identical.
 *
 * Three sizes, and they line up with the Button ladder on purpose — `sm` is
 * h-9, `md` is h-10, `lg` is h-11 — so a search input and the button beside
 * it are the same height without anyone hand-tuning a margin.
 *
 * These used to be 40/48/56 with a 16px radius, which made a four-field form
 * look like a mobile app blown up on a desktop screen. A form is dense
 * information, not a set of buttons: the ladder is now 36/40/44 on an 8px
 * radius, which is the size a control has to be to sit in a toolbar next to
 * six others without the row wrapping.
 *
 * `md` is the form-field size; `sm` is the toolbar control (search / group by /
 * filter / sort) so a row of them reads as one unit.
 *
 * Note the padding order: `px-3.5` is listed before `pl-10`, which is the order
 * Tailwind emits them in, so the icon inset wins. Do not reorder them.
 */
const SIZES = {
  sm: { base: 'h-9 rounded-lg px-3 text-[13px]', left: 'pl-9', right: 'pr-8' },
  md: { base: 'h-10 rounded-lg px-3.5 text-sm', left: 'pl-10', right: 'pr-10' },
  lg: { base: 'h-11 rounded-lg px-4 text-[15px]', left: 'pl-11', right: 'pr-11' },
};

export const controlClasses = ({
  error = false,
  leftIcon = false,
  rightIcon = false,
  size = 'md',
} = {}) => {
  const scale = SIZES[size] || SIZES.md;

  return cn(
    'w-full border bg-surface text-ink-900 placeholder:text-ink-300',
    'transition-[color,background-color,border-color,box-shadow] duration-200 outline-none',
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas-deep disabled:text-ink-500',
    // Focus and error share the border + ring, so the two colourways are
    // written as whole alternatives. Listing both `focus:border-*` colours at
    // once would leave the winner up to Tailwind's own emit order.
    error
      ? 'border-ember-500 bg-ember-50/40 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/25'
      : 'border-line-strong hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
    scale.base,
    leftIcon && scale.left,
    rightIcon && scale.right
  );
};

/**
 * The tint for an icon parked inside a control. The control carries `peer`, so
 * the icon has to be rendered *after* it in the DOM for `peer-focus` to reach.
 */
export const controlIconClasses = ({ error = false } = {}) =>
  cn(
    'pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors',
    error ? 'text-ember-500' : 'text-ink-500 peer-focus:text-brand-500'
  );
