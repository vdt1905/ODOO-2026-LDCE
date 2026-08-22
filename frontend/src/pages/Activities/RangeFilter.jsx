import { useEffect, useId, useState } from 'react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';

/**
 * A ceiling slider — "nothing over this".
 *
 * `value` is always a resolved number (the caller substitutes the maximum when
 * no filter is set); the caller also decides when a value stops being a filter,
 * because it is the one that knows the ceiling. Dragging is local and the
 * committed value is debounced, so one drag is one request rather than forty.
 *
 * The readout is Anton and sits in a pill of its own: it is the figure someone
 * is actually setting, and it has to be legible mid-drag.
 */
export const RangeFilter = ({ label, hint, value, max, step = 1, format, onCommit, disabled }) => {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  const debounced = useDebouncedValue(draft, 350);

  // Follow the caller when the change came from elsewhere — Clear filters, or
  // the ceiling arriving from /meta after the first paint. Adjusted during
  // render, not in an effect, so the slider never paints at the stale position.
  if (value !== seen) {
    setSeen(value);
    if (value !== debounced) setDraft(value);
  }

  useEffect(() => {
    if (debounced !== value) onCommit(debounced);
    // Only the settled value commits. `value` and `onCommit` are deliberately
    // out: the first re-fires this as the URL catches up, the second is an
    // inline arrow with a new identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold tracking-[0.09em] text-ink-700 uppercase"
        >
          {label}
        </label>
        <span className="rounded-full border border-line bg-inset px-3 py-1 font-display text-[13px] leading-none text-ink-900">
          {disabled ? '—' : draft >= max ? 'Any' : format(draft)}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={max || 1}
        step={step}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(Number(event.target.value))}
        className="mt-3.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-canvas-deep accent-brand-500 disabled:cursor-not-allowed disabled:opacity-55"
      />

      {hint && <p className="mt-2.5 text-xs leading-relaxed text-ink-500">{hint}</p>}
    </div>
  );
};
