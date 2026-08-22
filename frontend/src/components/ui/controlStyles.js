import { cn } from '../../lib/cn.js';

/** Shared field styling so inputs, textareas and selects stay identical. */
export const controlClasses = (hasError, hasLeftIcon, hasRightIcon) =>
  cn(
    'w-full rounded-2xl border bg-surface text-ink-900 placeholder:text-ink-300',
    'transition-colors duration-200 outline-none',
    'focus:border-clay-400 focus:ring-4 focus:ring-clay-500/12',
    'disabled:cursor-not-allowed disabled:bg-canvas-deep',
    hasError ? 'border-clay-500 bg-clay-50/40' : 'border-line',
    'h-12 px-4 text-sm',
    hasLeftIcon && 'pl-11',
    hasRightIcon && 'pr-11'
  );
