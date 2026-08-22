import { ArrowDownUp, LayoutGrid, ListFilter, Search, X } from 'lucide-react';

import { TRIP_FILTERS, TRIP_GROUPS, TRIP_SORTS } from '../../lib/constants.js';
import { Select } from '../ui/Select.jsx';

/**
 * The search / Group by / Filter / Sort by row from the mockup.
 *
 * Search, filter and sort are query params the API applies; grouping is purely
 * presentational and stays on the client. Labels say which list they act on,
 * because a bare "Filter" next to a wall of city cards is ambiguous.
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
}) => (
  <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-3 shadow-soft lg:flex-row lg:items-center">
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-300"
        aria-hidden
      />
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search your trips"
        aria-label="Search your trips"
        className="h-10 w-full rounded-full border border-line bg-canvas pr-10 pl-10 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/12"
      />
      {search && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Select
        size="sm"
        icon={LayoutGrid}
        aria-label="Group trips by"
        value={group}
        onChange={(event) => onGroupChange(event.target.value)}
        options={TRIP_GROUPS.map((option) => ({ ...option, label: `Group by ${option.label.toLowerCase()}` }))}
      />
      <Select
        size="sm"
        icon={ListFilter}
        aria-label="Filter trips"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
        options={TRIP_FILTERS}
      />
      <Select
        size="sm"
        icon={ArrowDownUp}
        aria-label="Sort trips"
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        options={TRIP_SORTS}
      />
    </div>
  </div>
);
