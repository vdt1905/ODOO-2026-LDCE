import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, LoadingState } from '../../components/ui/index.js';
import { TripCard } from '../../components/trip/TripCard.jsx';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const GROUPS = [['ongoing', 'In progress'], ['upcoming', 'Coming up'], ['completed', 'Past trips']];

const TripsPage = () => {
  usePageTitle('My trips');
  const [filters, setFilters] = useState({ search: '', sort: 'start-desc' });
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const load = useCallback(async () => { setState((old) => ({ ...old, loading: true, error: null })); try { const data = await tripApi.list({ ...filters, limit: 48 }); setState({ loading: false, error: null, items: data.items }); } catch (error) { setState((old) => ({ ...old, loading: false, error: toApiError(error) })); } }, [filters]);
  useEffect(() => { const timer = window.setTimeout(load, 200); return () => window.clearTimeout(timer); }, [load]);
  const byStatus = useMemo(() => Object.groupBy ? Object.groupBy(state.items, ({ status }) => status) : state.items.reduce((all, item) => ({ ...all, [item.status]: [...(all[item.status] || []), item] }), {}), [state.items]);
  const remove = async (trip) => { if (!window.confirm(`Delete “${trip.name}”? This also removes all stops and activities.`)) return; try { await tripApi.remove(trip._id); load(); } catch (error) { setState((old) => ({ ...old, error: toApiError(error) })); } };
  return <section className="mx-auto max-w-6xl px-4 pb-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm text-clay-600">Your saved routes</p><h1 className="mt-1 font-display text-4xl font-semibold">My trips</h1><p className="mt-2 text-sm text-ink-500">Everything you’re dreaming about, in one place.</p></div><Button to="/trips/new" leftIcon={<Plus className="size-4" />}>Plan a trip</Button></div><div className="mt-8 flex flex-col gap-3 rounded-3xl border border-line bg-surface p-3 sm:flex-row"><Input wrapperClassName="mb-0 flex-1" aria-label="Search trips" placeholder="Search trips" icon={Search} value={filters.search} onChange={(event) => setFilters((old) => ({ ...old, search: event.target.value }))} /><select aria-label="Sort trips" className="rounded-2xl border border-line bg-canvas px-4 text-sm text-ink-700" value={filters.sort} onChange={(event) => setFilters((old) => ({ ...old, sort: event.target.value }))}><option value="start-desc">Newest dates first</option><option value="start-asc">Soonest dates first</option><option value="recent">Recently created</option><option value="name">Name A-Z</option></select></div>{state.loading ? <div className="mt-8"><LoadingState label="Finding your trips" /></div> : state.error ? <div className="mt-8"><ErrorState error={state.error} retry={load} /></div> : state.items.length === 0 ? <div className="mt-8"><EmptyState title="No trips match that search" description="A fresh itinerary is never far away." action={<Button to="/trips/new">Create a trip</Button>} /></div> : <div className="space-y-10">{GROUPS.map(([key, title]) => byStatus[key]?.length ? <div key={key}><h2 className="mb-4 mt-10 font-display text-2xl font-semibold">{title}</h2><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{byStatus[key].map((trip) => <TripCard key={trip._id} trip={trip} onDelete={remove} />)}</div></div> : null)}</div>}</section>;
};
export default TripsPage;
