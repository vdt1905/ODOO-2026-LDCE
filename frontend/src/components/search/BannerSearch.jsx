import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';

/**
 * The search pill that sits inside a PageHeader photograph.
 *
 * Styled off the landing hero's search bar so the two read as the same control
 * in the same place — a glass-edged pill on the image rather than a form field
 * stranded on the page below it.
 *
 * `value` is the committed term (which lives in the URL); `onChange` fires only
 * once typing settles, so a search is one request rather than one per keystroke.
 */
export const BannerSearch = ({ value, onChange, placeholder, label }) => {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);
  const debounced = useDebouncedValue(draft, 350);
  const settled = debounced.trim();

  // Follow the URL when it changed from somewhere else — the nav link back to a
  // bare /cities, or Clear filters. Adjusted during render rather than in an
  // effect, which would paint the stale term first; the guard on `settled`
  // means our own commit below, arriving here a render later, cannot overwrite
  // the keystrokes typed since.
  if (value !== seen) {
    setSeen(value);
    if (value !== settled) setDraft(value);
  }

  useEffect(() => {
    if (settled !== value) onChange(settled);
    // Only the settled term pushes upward. Listing `value` would re-fire this
    // as the URL catches up, and `onChange` is an inline arrow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="relative w-full max-w-xl"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-ink-300"
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-14 w-full rounded-full border border-white/30 bg-surface/95 pr-14 pl-13 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </form>
  );
};
