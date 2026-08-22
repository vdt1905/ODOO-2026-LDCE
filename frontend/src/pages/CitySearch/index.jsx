import { useCallback, useEffect, useState } from 'react';
import { Heart, MapPin, Plus, Search, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, LoadingState } from '../../components/ui/index.js';
import { cityApi } from '../../api/city.api.js';
import { tripApi } from '../../api/trip.api.js';
import { userApi } from '../../api/user.api.js';
import { toApiError } from '../../api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const CitySearchPage = () => {
  usePageTitle('Explore cities');
  const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState({
    search: '', country: '', region: '', maxCost: '', minPopularity: '',
  });
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const [adding, setAdding] = useState(null);
  const [trips, setTrips] = useState([]);
  const [message, setMessage] = useState('');
  const [savedIds, setSavedIds] = useState(new Set());

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const data = await cityApi.list({ ...filters, limit: 24 });
      setState({ loading: false, error: null, items: data.items });
    } catch (error) {
      setState((old) => ({ ...old, loading: false, error: toApiError(error) }));
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(load, 220);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    userApi.savedDestinations().then((items) => {
      if (active) setSavedIds(new Set(items.map((city) => city._id)));
    }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  const openAdd = async (city) => {
    if (!user) { setMessage('Sign in to add destinations to a trip.'); return; }
    try {
      const rows = await tripApi.list({ limit: 50, sort: 'start-desc' });
      setTrips(rows.items.filter((trip) => !trip.destinationCountry || trip.destinationCountry === city.country));
      setAdding(city);
    } catch (error) { setMessage(toApiError(error).message); }
  };

  const addToTrip = async (tripId) => {
    try {
      const data = await tripApi.get(tripId);
      await tripApi.stops.create(tripId, {
        cityId: adding._id,
        startDate: data.trip.startDate.slice(0, 10),
        endDate: data.trip.endDate.slice(0, 10),
        transportCost: 0,
        accommodationCost: 0,
        mealBudgetPerDay: 0,
      });
      setMessage(`${adding.name} was added to ${data.trip.name}.`);
      setAdding(null);
    } catch (error) { setMessage(toApiError(error).message); }
  };

  const toggleSaved = async (city) => {
    if (!user) { setMessage('Sign in to save destinations.'); return; }
    try {
      const items = savedIds.has(city._id)
        ? await userApi.unsaveDestination(city._id)
        : await userApi.saveDestination(city._id);
      setSavedIds(new Set(items.map((item) => item._id)));
    } catch (error) { setMessage(toApiError(error).message); }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="max-w-2xl"><p className="text-sm text-clay-600">Find a new favourite</p><h1 className="mt-1 font-display text-4xl font-semibold">Explore cities</h1><p className="mt-2 text-sm text-ink-500">Search by name, country, or region; save the places that keep calling you back.</p></div>
      <div className="mt-7 grid gap-3 rounded-4xl border border-line bg-surface p-4 md:grid-cols-2 lg:grid-cols-5">
        <Input wrapperClassName="mb-0" aria-label="Search cities" icon={Search} placeholder="Search Tokyo, Paris, Bali…" value={filters.search} onChange={(event) => setFilters((old) => ({ ...old, search: event.target.value }))} />
        <Input wrapperClassName="mb-0" aria-label="Country" placeholder="Country" value={filters.country} onChange={(event) => setFilters((old) => ({ ...old, country: event.target.value }))} />
        <select aria-label="Region" className="h-12 rounded-2xl border border-line bg-canvas px-4 text-sm" value={filters.region} onChange={(event) => setFilters((old) => ({ ...old, region: event.target.value }))}><option value="">All regions</option>{['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'].map((region) => <option key={region}>{region}</option>)}</select>
        <select aria-label="Maximum cost index" className="h-12 rounded-2xl border border-line bg-canvas px-4 text-sm" value={filters.maxCost} onChange={(event) => setFilters((old) => ({ ...old, maxCost: event.target.value }))}><option value="">Any cost</option><option value="35">Budget-friendly</option><option value="60">Up to mid-range</option><option value="80">Up to premium</option></select>
        <select aria-label="Minimum popularity" className="h-12 rounded-2xl border border-line bg-canvas px-4 text-sm" value={filters.minPopularity} onChange={(event) => setFilters((old) => ({ ...old, minPopularity: event.target.value }))}><option value="">Any popularity</option><option value="70">Popular 70+</option><option value="85">Trending 85+</option><option value="95">Top picks 95+</option></select>
      </div>
      {message && <div className="mt-4 flex items-center justify-between rounded-2xl border border-moss-100 bg-moss-50 p-3 text-sm text-moss-800"><span>{message}</span><button type="button" onClick={() => setMessage('')}><X className="size-4" /></button></div>}
      {state.loading ? <div className="mt-7"><LoadingState label="Searching the globe" /></div> : state.error ? <div className="mt-7"><ErrorState error={state.error} retry={load} /></div> : state.items.length === 0 ? <div className="mt-7"><EmptyState title="No cities found" description="Try a broader search or a different region." /></div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.items.map((city) => <CityCard key={city._id} city={city} saved={savedIds.has(city._id)} onSave={() => toggleSaved(city)} onAdd={() => openAdd(city)} />)}</div>}
      {adding && <PickTrip city={adding} trips={trips} onClose={() => setAdding(null)} onPick={addToTrip} />}
    </section>
  );
};

const CityCard = ({ city, saved, onSave, onAdd }) => <article className="overflow-hidden rounded-4xl border border-line bg-surface shadow-soft"><div className="h-32 bg-gradient-to-br from-dawn-300 via-clay-400 to-dusk-600" style={city.imageUrl ? { backgroundImage: `linear-gradient(rgba(23,20,15,.12), rgba(23,20,15,.55)), url(${city.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} /><div className="p-5"><div className="flex justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">{city.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-ink-500"><MapPin className="size-3.5" />{city.country}</p></div><button type="button" onClick={onSave} aria-label={`${saved ? 'Remove' : 'Save'} ${city.name}`} className={`grid size-9 place-items-center rounded-full transition-colors ${saved ? 'bg-clay-500 text-white' : 'bg-clay-50 text-clay-600 hover:bg-clay-100'}`}><Heart className={`size-4 ${saved ? 'fill-current' : ''}`} /></button></div><p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-500">{city.description || 'A destination with plenty of room for a memorable itinerary.'}</p><div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-500"><span>Cost index {city.costIndex}/100</span><span>Popularity {city.popularity}/100</span></div><Button className="mt-5" fullWidth size="sm" onClick={onAdd} leftIcon={<Plus className="size-3.5" />}>Add to a trip</Button></div></article>;

const PickTrip = ({ city, trips, onClose, onPick }) => <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-4xl bg-surface p-6 shadow-lift"><div className="flex justify-between"><div><p className="text-sm text-clay-600">Add destination</p><h2 className="font-display text-2xl font-semibold">{city.name}</h2><p className="mt-1 text-xs text-ink-500">Only compatible {city.country} trips are shown.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-canvas"><X className="size-5" /></button></div><div className="mt-5 space-y-2">{trips.length ? trips.map((trip) => <button type="button" key={trip._id} onClick={() => onPick(trip._id)} className="w-full rounded-2xl border border-line p-4 text-left hover:border-clay-300 hover:bg-canvas"><strong className="block text-sm">{trip.name}</strong><span className="mt-1 block text-xs text-ink-500">{trip.startDate.slice(0, 10)} to {trip.endDate.slice(0, 10)}</span></button>) : <EmptyState title="No compatible trips" description={`Create a ${city.country} trip before adding this city.`} action={<Button to="/trips/new">Plan a trip</Button>} />}</div></div></div>;

export default CitySearchPage;
