import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Label + control + error/hint. Every form control is wrapped in this.
 *
 * The label is the same small, wide, quiet Poppins as `.eyebrow` — at that size
 * it reads as a tag on the field rather than a sentence competing with it, and
 * it keeps every form on the site in the same voice.
 *
 * An error is ember, never brand: green is the "go" colour on this palette, so
 * a green validation message says the opposite of what it means.
 */
export const Field = ({ label, htmlFor, error, hint, required, className, children }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="text-[10.5px] font-semibold tracking-[0.1em] text-ink-500 uppercase"
      >
        {label}
        {/* Hidden from the accessibility tree so the field's accessible name
            stays "Password", not "Password *". */}
        {required && (
          <span className="ml-1 text-brand-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}

    {children}

    {error ? (
      <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-ember-700">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>{error}</span>
      </p>
    ) : (
      hint && <p className="text-xs leading-relaxed text-ink-500">{hint}</p>
    )}
  </div>
);
