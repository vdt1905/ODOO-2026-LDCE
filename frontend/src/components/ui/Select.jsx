import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { Field } from './Field.jsx';
import { controlClasses, controlIconClasses } from './controlStyles.js';

/**
 * A select with a list we draw ourselves.
 *
 * This used to be a bare native `<select>`. Everything about the *closed*
 * control was ours — height, radius, border, icon — and then it opened an
 * operating-system list box: system blue highlight, system font, square
 * corners, hard against the field. On a page built out of 1px borders and warm
 * paper that popup is the one element that looks like it belongs to another
 * program.
 *
 * So the native element is still here, but hidden: it keeps the form wiring
 * (`name`, `ref`, `onChange`, `onBlur`, validation, and react-hook-form's
 * `register` spread) working exactly as before, and it is what a browser
 * autofill or a form reset writes to. The visible control is a `role="combobox"`
 * button and the list is a `role="listbox"` we style like the rest of the app.
 *
 * Selecting an option writes through the native value setter and dispatches a
 * bubbling `change`, which is what React's synthetic `onChange` listens for —
 * so consumers cannot tell the difference between this and a real select.
 *
 * `options` is `[{ value, label }]`. `size="sm"` is the toolbar pill.
 */

/** Write to a native select the way the browser would, so React notices. */
const setNativeValue = (element, value) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

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
    disabled,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  const listId = `${selectId}-list`;

  const nativeRef = useRef(null);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  // Keep the visible label in step with the hidden element. An effect with no
  // dependency list runs after every render, which is what catches the writes
  // we never see: `reset()` and `setValue()` from react-hook-form set the DOM
  // value straight through the ref, without a change event to listen for.
  //
  // The lint rule wants `[current]` here, which would defeat the point: the
  // effect has to re-read the DOM on *every* render, not only when our own
  // state moved. The `!==` guard is what stops the update chain.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const value = nativeRef.current?.value ?? '';
    if (value !== current) setCurrent(value);
  });

  const selected = options.find((option) => String(option.value) === String(current));

  const commit = useCallback((value) => {
    if (nativeRef.current) setNativeValue(nativeRef.current, value);
    setCurrent(value);
  }, []);

  const close = useCallback(({ focusTrigger = true } = {}) => {
    setOpen(false);
    setActiveIndex(-1);
    if (focusTrigger) rootRef.current?.querySelector('[role="combobox"]')?.focus();
  }, []);

  // Dismiss on an outside press or Escape. `pointerdown` rather than `click` so
  // the list closes before whatever was underneath it takes the press.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) close({ focusTrigger: false });
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, close]);

  // Open onto the current choice, and keep it in view in a long list.
  useEffect(() => {
    if (!open) return;
    const index = options.findIndex((option) => String(option.value) === String(current));
    setActiveIndex(index);
    requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const move = (delta) => {
    if (!options.length) return;
    setActiveIndex((index) => {
      const next = (index + delta + options.length) % options.length;
      requestAnimationFrame(() => {
        listRef.current
          ?.querySelectorAll('[role="option"]')
          ?.[next]?.scrollIntoView({ block: 'nearest' });
      });
      return next;
    });
  };

  const onTriggerKeyDown = (event) => {
    if (disabled) return;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (options[activeIndex]) commit(options[activeIndex].value);
      close();
    } else if (event.key === 'Tab') {
      close({ focusTrigger: false });
    }
  };

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const iconTint = controlIconClasses({ error: Boolean(error) });

  return (
    <Field
      label={label}
      htmlFor={selectId}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative" ref={rootRef}>
        {/* The real control. Hidden from sight and from the tab order, but a
            first-class form participant — it is what `register` binds to. */}
        <select
          ref={(node) => {
            nativeRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={selectId}
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          required={required}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          aria-label={label || placeholder || undefined}
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={onTriggerKeyDown}
          onBlur={props.onBlur}
          className={cn(
            'peer flex items-center text-left',
            controlClasses({
              error: Boolean(error),
              leftIcon: Boolean(Icon),
              rightIcon: true,
              size,
            }),
            'cursor-pointer',
            open && !error && 'border-brand-500 ring-2 ring-brand-500/20',
            className
          )}
        >
          <span className={cn('truncate', !selected && 'text-ink-300')}>
            {selected ? selected.label : placeholder || 'Select…'}
          </span>
        </button>

        {Icon && (
          <Icon
            className={cn(iconTint, size === 'sm' ? 'left-3' : 'left-3.5', iconSize)}
            aria-hidden
          />
        )}

        <ChevronDown
          className={cn(
            iconTint,
            size === 'sm' ? 'right-2.5' : 'right-3',
            iconSize,
            open && 'rotate-180'
          )}
          aria-hidden
        />

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label || placeholder || 'Options'}
            className={cn(
              'absolute top-[calc(100%+0.3rem)] right-0 left-0 z-50 max-h-64 overflow-y-auto',
              'rounded-lg border border-line-strong bg-surface p-1',
              'shadow-[0_18px_44px_-24px_rgba(8,12,9,0.55)]'
            )}
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-ink-500">Nothing to choose from</li>
            )}

            {options.map((option, index) => {
              const isSelected = String(option.value) === String(current);
              const isActive = index === activeIndex;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      commit(option.value);
                      close();
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left',
                      size === 'sm' ? 'text-[13px]' : 'text-sm',
                      isSelected ? 'font-semibold text-brand-700' : 'text-ink-700',
                      isActive && 'bg-brand-50'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="size-3.5 shrink-0 text-brand-500" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
});
