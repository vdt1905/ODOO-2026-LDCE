import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../ui/index.js';

/**
 * Prev / next for a paged catalog list.
 *
 * Deliberately not numbered pages: the catalog is browsed, not indexed, and
 * nobody is trying to get back to page 7 of an activity search.
 */
export const Pagination = ({ page, pages, onChange, label = 'Pagination' }) => {
  if (!pages || pages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-surface px-4 py-3"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        leftIcon={<ChevronLeft className="size-4" />}
      >
        Previous
      </Button>

      {/* aria-live so a screen reader hears where it landed after a click. */}
      <p aria-live="polite" className="text-sm text-ink-500">
        Page {page} of {pages}
      </p>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        rightIcon={<ChevronRight className="size-4" />}
      >
        Next
      </Button>
    </nav>
  );
};
