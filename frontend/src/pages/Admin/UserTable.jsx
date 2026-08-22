import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Trash2, UserX, X } from 'lucide-react';

import { adminApi } from '../../api/admin.api.js';
import { toApiError } from '../../api/client.js';
import { formatDate } from '../../lib/dates.js';
import { formatNumber, pluralise } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Select,
} from '../../components/ui/index.js';
import { Panel } from './Panel.jsx';

const PAGE_SIZE = 10;

const ROLE_FILTERS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

/** This endpoint returns a trimmed user — no `fullName` virtual to lean on. */
const nameOf = (user) => `${user.firstName} ${user.lastName}`.trim() || user.email;

export const UserTable = ({ currentUserId }) => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, loading, error, refresh, setData } = useAsync(
    () =>
      adminApi.users({
        search: debouncedSearch || undefined,
        role: role || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    [debouncedSearch, role, page]
  );

  // Narrowing the list almost never leaves you a page 4 to be on, and landing
  // on an empty one reads as "no matches" when page 1 was full of them. Done in
  // the handlers rather than an effect so there is no second render to watch it.
  const applySearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const applyRole = (value) => {
    setRole(value);
    setPage(1);
  };

  const items = data?.items ?? [];
  const pages = data?.pages ?? 1;
  const total = data?.total ?? 0;
  const isFiltered = Boolean(debouncedSearch) || Boolean(role);

  const changeRole = async (user, nextRole) => {
    setActionError(null);
    setNotice(null);
    setBusyId(user._id);

    try {
      const updated = await adminApi.setRole(user._id, nextRole);
      setData((current) => ({
        ...current,
        items: current.items.map((row) =>
          row._id === user._id ? { ...row, role: updated.role } : row
        ),
      }));
      setNotice(`${nameOf(user)} is now ${updated.role === 'admin' ? 'an admin' : 'a user'}.`);
    } catch (failure) {
      setActionError(toApiError(failure).message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setActionError(null);
    setNotice(null);
    setDeleting(true);

    try {
      const { tripsRemoved } = await adminApi.removeUser(pendingDelete._id);
      setNotice(
        `${nameOf(pendingDelete)} was removed along with ${pluralise(tripsRemoved, 'trip')}.`
      );
      // Deleting the last row on a page leaves it empty, so step back instead
      // of refetching a page that no longer exists.
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else refresh();
      setPendingDelete(null);
    } catch (failure) {
      setActionError(toApiError(failure).message);
    } finally {
      setDeleting(false);
    }
  };

  const controls = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <div className="relative sm:w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-300"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => applySearch(event.target.value)}
          placeholder="Search name or email"
          aria-label="Search users"
          className="h-10 w-full rounded-full border border-line bg-canvas pr-9 pl-10 text-sm text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/12"
        />
        {search && (
          <button
            type="button"
            onClick={() => applySearch('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition-colors hover:bg-canvas-deep hover:text-ink-900"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      <Select
        size="sm"
        aria-label="Filter by role"
        value={role}
        onChange={(event) => applyRole(event.target.value)}
        options={ROLE_FILTERS}
        wrapperClassName="sm:w-36"
      />
    </div>
  );

  return (
    <Panel
      title="Users"
      description={
        loading ? 'Loading accounts…' : `${pluralise(total, 'account')}${isFiltered ? ' matching your filters' : ''}`
      }
      action={controls}
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" title="The user list could not be loaded">
            {error.message}
          </Alert>
        )}
        {actionError && <Alert tone="error" title="That did not work">{actionError}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-canvas-deep" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={UserX}
            title={isFiltered ? 'No users match that' : 'No accounts yet'}
            description={
              isFiltered
                ? 'Try a different search, or clear the role filter.'
                : 'Accounts appear here as people sign up.'
            }
          />
        ) : (
          <>
            {/* The table stays readable at its natural width and scrolls inside
                this wrapper; the page itself never scrolls sideways. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-176 border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-wide text-ink-500 uppercase">
                    <th scope="col" className="py-2 pr-3 font-medium">Person</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Location</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Trips</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Joined</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Role</th>
                    <th scope="col" className="py-2 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((user) => {
                    // The server refuses both actions on your own account, so
                    // the controls are off rather than offering a guaranteed 400.
                    const isSelf = String(user._id) === String(currentUserId);
                    const busy = busyId === user._id;

                    return (
                      <tr key={user._id} className="border-b border-line last:border-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} size="size-9" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 truncate font-medium text-ink-900">
                                {nameOf(user)}
                                {isSelf && <Badge tone="brand">You</Badge>}
                              </p>
                              <p className="truncate text-xs text-ink-500">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-3 text-ink-700">
                          {[user.city, user.country].filter(Boolean).join(', ') || '—'}
                        </td>

                        <td className="py-3 pr-3 text-ink-700 tabular-nums">
                          {formatNumber(user.tripCount)}
                        </td>

                        <td className="py-3 pr-3 whitespace-nowrap text-ink-500">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="py-3 pr-3">
                          <Select
                            size="sm"
                            aria-label={`Role for ${nameOf(user)}`}
                            value={user.role}
                            disabled={isSelf || busy}
                            onChange={(event) => changeRole(user, event.target.value)}
                            options={ROLE_OPTIONS}
                            wrapperClassName="w-28"
                          />
                        </td>

                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setNotice(null);
                              setPendingDelete(user);
                            }}
                            disabled={isSelf || busy}
                            aria-label={`Delete ${nameOf(user)}`}
                            className="grid size-9 place-items-center rounded-full text-ink-300 transition-colors hover:bg-ember-50 hover:text-ember-700 disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <p className="text-xs text-ink-500">
                  Page {page} of {pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    leftIcon={<ChevronLeft className="size-4" />}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((current) => Math.min(pages, current + 1))}
                    disabled={page >= pages}
                    rightIcon={<ChevronRight className="size-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        loading={deleting}
        title={`Delete ${pendingDelete ? nameOf(pendingDelete) : ''}?`}
        description={
          pendingDelete
            ? `This removes the account and cascades to every trip they own — ${pluralise(
                pendingDelete.tripCount,
                'trip'
              )}, with all their stops and activities. It cannot be undone.`
            : ''
        }
        confirmLabel="Delete account"
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
        }}
      />
    </Panel>
  );
};
