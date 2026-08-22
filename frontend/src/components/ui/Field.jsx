import { cn } from '../../lib/cn.js';

/** Label + control + error/hint. Every form control is wrapped in this. */
export const Field = ({ label, htmlFor, error, hint, required, className, children }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-clay-500">*</span>}
      </label>
    )}

    {children}

    {error ? (
      <p role="alert" className="text-xs font-medium text-clay-600">
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-ink-500">{hint}</p>
    )}
  </div>
);
