import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClasses } from './controlStyles.js';

/** Text input with an optional leading icon. `error` is a string message. */
export const Input = forwardRef(function Input(
  { label, error, hint, required, icon: Icon, className, wrapperClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-300"
            aria-hidden
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(controlClasses({ error: Boolean(error), leftIcon: Boolean(Icon) }), className)}
          {...props}
        />
      </div>
    </Field>
  );
});

/** Password input with a show/hide toggle. */
export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, hint, required, icon: Icon, className, wrapperClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const [visible, setVisible] = useState(false);

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-300"
            aria-hidden
          />
        )}
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className={cn(controlClasses({ error: Boolean(error), leftIcon: Boolean(Icon), rightIcon: true }), className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
});

/** Multi-line input — used by "Additional information" on the signup form. */
export const TextArea = forwardRef(function TextArea(
  { label, error, hint, required, rows = 4, className, wrapperClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          controlClasses({ error: Boolean(error) }),
          'h-auto resize-none py-3 leading-relaxed',
          className
        )}
        {...props}
      />
    </Field>
  );
});
