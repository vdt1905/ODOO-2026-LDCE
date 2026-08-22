import { cn } from '../../lib/cn.js';

/**
 * Shared field styling so inputs, textareas and selects stay identical.
 *
 * `md` is the form-field size; `sm` is the pill used by toolbar controls
 * (search / group by / filter / sort) so a row of them reads as one unit.
 *
 * Note the padding order: `px-4` is listed before `pl-11`, which is the order
 * Tailwind emits them in, so the icon inset wins. Do not reorder them.
 */
const SIZES = {
  md: { base: 'h-12 rounded-2xl px-4 text-sm', left: 'pl-11', right: 'pr-11' },
  sm: { base: 'h-10 rounded-full px-4 text-sm', left: 'pl-10', right: 'pr-9' },
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
    'transition-colors duration-200 outline-none',
    'focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12',
    'disabled:cursor-not-allowed disabled:bg-canvas-deep',
    error ? 'border-brand-500 bg-brand-50/40' : 'border-line',
    scale.base,
    leftIcon && scale.left,
    rightIcon && scale.right
  );
};
