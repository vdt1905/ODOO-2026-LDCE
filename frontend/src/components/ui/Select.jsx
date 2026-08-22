import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClasses } from './controlStyles.js';

/**
 * A native `<select>` under our own chrome.
 *
 * Native on purpose: it gets the platform picker on mobile, keyboard type-ahead
 * for free, and never traps focus — none of which a hand-rolled dropdown would
 * have without a lot of code we do not need yet.
 *
 * `options` is `[{ value, label }]`. `size="sm"` is the toolbar pill.
 */
export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required,
    options = [],
    placeholder,
    icon: Icon,
    size = 'md',
    className,
    wrapperClassName,
    id,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';

  return (
    <Field
      label={label}
      htmlFor={selectId}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-500',
              size === 'sm' ? 'left-3.5' : 'left-4',
              iconSize
            )}
            aria-hidden
          />
        )}

        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            controlClasses({ error: Boolean(error), leftIcon: Boolean(Icon), rightIcon: true, size }),
            'cursor-pointer appearance-none',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-500',
            size === 'sm' ? 'right-3' : 'right-4',
            iconSize
          )}
          aria-hidden
        />
      </div>
    </Field>
  );
});
