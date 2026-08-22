import { useId } from 'react';
import { ArrowDownUp, LayoutGrid, ListFilter, Search, X } from 'lucide-react';

import { TRIP_FILTERS, TRIP_GROUPS, TRIP_SORTS } from '../../lib/constants.js';
import { Field } from '../ui/Field.jsx';
import { Select } from '../ui/Select.jsx';
import { controlClasses } from '../ui/controlStyles.js';

/** What "nothing applied" looks like — used to decide the chips and Clear all. */
const DEFAULT_FILTER = 'all';
const DEFAULT_SORT = 'start-asc';

const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? '';

/**
 * One applied control, with the X that takes it off again. Filters you cannot
 * see are filters you cannot undo — the row of chips is the only place the app
 * admits that the list below is not showing everything.
 */
const ActiveChip = ({ label, value, onClear }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas-deep py-1 pr-1 pl-3 text-xs text-ink-700">
    <span className="font-semibold text-ink-500">{label}:</span>
    <span className="max-w-45 truncate">{value}</span>
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear ${label.toLowerCase()}`}
      className="grid size-5 cursor-pointer place-items-center rounded-full text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
    >
      <X className="size-3" aria-hidden />
    </button>
  </span>
);

/**
 * The search / Group by / Filter / Sort row above the trip grid.
 *
 * Search, filter and sort are query params the API applies; grouping is purely
 * presentational and stays on the client. Every control carries a visible
 * label — a row of bare pills makes you open each one to find out what it does
 * — and anything currently narrowing the list is repeated as a chip underneath
 * with a one-click way off it.
 */
export const TripToolbar = ({
  search,
  onSearchChange,
  group,
  onGroupChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}) => {
  const searchId = useId();
  const term = search.trim();

  const chips = [
    term && { key: 'search', label: 'Search', value: `“${term}”`, clear: () => onSearchChange('') },
    filter !== DEFAULT_FILTER && {
      key: 'filter',
      label: 'Showing',
      value: labelOf(TRIP_FILTERS, filter),
      clear: () => onFilterChange(DEFAULT_FILTER),
    },
    sort !== DEFAULT_SORT && {
      key: 'sort',
      label: 'Sorted by',
      value: labelOf(TRIP_SORTS, sort),
      clear: () => onSortChange(DEFAULT_SORT),
    },
  ].filter(Boolean);

  const clearAll = () => {
    onSearchChange('');
    onFilterChange(DEFAULT_FILTER);
    onSortChange(DEFAULT_SORT);
  };

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <Field label="Search your trips" htmlFor={searchId}>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Trip name or city"
              className={controlClasses({ leftIcon: true, rightIcon: true, size: 'sm' })}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-ink-500 transition-colors hover:bg-canvas-deep hover:text-ink-900"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        </Field>

        <Select
          size="sm"
          label="Group by"
          icon={LayoutGrid}
          value={group}
          onChange={(event) => onGroupChange(event.target.value)}
          options={TRIP_GROUPS}
        />
        <Select
          size="sm"
          label="Show"
          icon={ListFilter}
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          options={TRIP_FILTERS}
        />
        <Select
          size="sm"
          label="Sort by"
          icon={ArrowDownUp}
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          options={TRIP_SORTS}
        />
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
          <span className="eyebrow mr-1 text-ink-500">Applied</span>

          {chips.map((chip) => (
            <ActiveChip
              key={chip.key}
              label={chip.label}
              value={chip.value}
              onClear={chip.clear}
            />
          ))}

          <button
            type="button"
            onClick={clearAll}
            className="ml-auto cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
