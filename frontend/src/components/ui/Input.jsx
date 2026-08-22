import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClasses, controlIconClasses } from './controlStyles.js';

/**
 * Text input with an optional leading icon. `error` is a string message.
 *
 * The icon is rendered *after* the input and positioned back over it: the
 * input carries `peer`, and `peer-*` only reaches later siblings, which is what
 * lets the icon pick up the brand tint while the field has focus.
 */
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
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'peer',
            controlClasses({ error: Boolean(error), leftIcon: Boolean(Icon) }),
            className
          )}
          {...props}
        />
        {Icon && (
          <Icon
            className={cn(controlIconClasses({ error: Boolean(error) }), 'left-3.5 size-4')}
            aria-hidden
          />
        )}
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
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          className={cn(
            'peer',
            controlClasses({ error: Boolean(error), leftIcon: Boolean(Icon), rightIcon: true }),
            className
          )}
          {...props}
        />
        {Icon && (
          <Icon
            className={cn(controlIconClasses({ error: Boolean(error) }), 'left-3.5 size-4')}
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
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
          'h-auto resize-none py-2.5 leading-relaxed',
          className
        )}
        {...props}
      />
    </Field>
  );
});
