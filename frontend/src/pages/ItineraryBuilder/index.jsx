import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, CirclePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { activityApi } from '../../api/activity.api.js';
import { cityApi } from '../../api/city.api.js';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { Button, EmptyState, ErrorState, Input, LoadingState, TextArea } from '../../components/ui/index.js';
import { dateInput, money } from '../../lib/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const move = (items, index, direction) => {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const fallbackCountries = [
  'Argentina', 'Australia', 'Brazil', 'Canada', 'Czechia', 'France', 'Greece', 'Iceland', 'India', 'Indonesia',
  'Italy', 'Japan', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Peru', 'Portugal', 'Singapore',
  'South Africa', 'Spain', 'Switzerland', 'Tanzania', 'Thailand', 'United Arab Emirates', 'United States', 'Vietnam',
];

const ItineraryBuilderPage = () => {
  const { id } = useParams();
  usePageTitle('Build itinerary');
  const [state, setState] = useState({ loading: true, error: null, trip: null });
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [countryOverride, setCountryOverride] = useState('');
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [activityStop, setActivityStop] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [activityEditor, setActivityEditor] = useState(null);
  const [activityForm, setActivityForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const pickerCountry = state.trip?.destinationCountry || state.trip?.stops?.[0]?.city?.country || countryOverride;
  const availableCountries = [...new Set([...countryOptions, ...fallbackCountries])].sort((a, b) => a.localeCompare(b));

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const data = await tripApi.get(id);
      setState({ loading: false, error: null, trip: data.trip });
    } catch (error) {
      setState((old) => ({ ...old, loading: false, error: toApiError(error) }));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!addStopOpen) return undefined;
    if (!pickerCountry) {
      setCityResults([]);
      cityApi.list({ limit: 48, sort: 'name' }).then((rows) => {
        setCountryOptions([...new Set(rows.items.map((city) => city.country))].sort((a, b) => a.localeCompare(b)));
      }).catch(() => setCountryOptions([]));
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const rows = await cityApi.list({
          search: citySearch,
          country: pickerCountry,
          limit: 48,
        });
        setCityResults(rows.items);
      } catch {
        setCityResults([]);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [addStopOpen, citySearch, pickerCountry]);
  useEffect(() => {
    if (!activityStop) return;
    activityApi.list({ city: activityStop.city._id, limit: 20 }).then((data) => setCatalog(data.items)).catch(() => setCatalog([]));
  }, [activityStop]);

  const alter = async (action) => {
    setSaving(true);
    try {
      await action();
      await load();
      return true;
    } catch (error) {
      setState((old) => ({ ...old, error: toApiError(error) }));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addStop = async (city) => {
    const trip = state.trip;
    if (!pickerCountry) {
      setState((old) => ({ ...old, error: { message: 'This trip needs a country before a city can be added.' } }));
      return;
    }
    if (trip.stops.some((stop) => stop.city._id === city._id)) {
      setState((old) => ({ ...old, error: { message: `${city.name} is already in this trip.` } }));
      return;
    }
    const added = await alter(async () => {
      await tripApi.stops.create(id, {
        cityId: city._id,
        startDate: dateInput(trip.startDate),
        endDate: dateInput(trip.endDate),
        transportCost: 0,
        accommodationCost: 0,
        mealBudgetPerDay: 0,
      });
    });
    if (added) {
      setAddStopOpen(false);
      setCitySearch('');
    }
  };

  const updateStop = (stop, payload) => alter(() => tripApi.stops.update(id, stop._id, payload));
  const setTripCountry = (event) => {
    const destinationCountry = event.target.value;
    if (!destinationCountry) return;
    setCountryOverride(destinationCountry);
    // New trips already have this value. For older trips, attempt to persist it
    // without making city selection depend on a legacy-record update succeeding.
    tripApi.update(id, { destinationCountry }).then(() => load()).catch(() => {});
  };
  const reorderStops = (index, direction) => {
    const ordered = move(state.trip.stops, index, direction);
    return alter(() => tripApi.stops.reorder(id, ordered.map((stop) => stop._id)));
  };
  const addCatalogActivity = (activity) => alter(async () => {
    await tripApi.activities.create(id, {
      stopId: activityStop._id,
      activityId: activity._id,
      date: dateInput(activityStop.startDate),
      startTime: '10:00',
    });
    setActivityStop(null);
  });
  const addCustomActivity = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customName = String(form.get('customName') || '').trim();
    if (!customName) return;
    alter(async () => {
      await tripApi.activities.create(id, {
        stopId: activityStop._id,
        customName,
        date: form.get('date'),
        startTime: form.get('startTime') || '',
        cost: Number(form.get('cost') || 0),
        durationMinutes: Number(form.get('durationMinutes') || 60),
      });
      setActivityStop(null);
    });
  };

  const openActivityEditor = (stop, activity) => {
    setActivityEditor({ stop, activity });
    setActivityForm({
      name: activity.activity?.name || activity.customName || '',
      date: dateInput(activity.date),
      startTime: activity.startTime || '',
      durationMinutes: String(activity.durationMinutes ?? 60),
      cost: String(activity.cost ?? 0),
      notes: activity.notes || '',
    });
  };
  const saveActivity = async (event) => {
    event.preventDefault();
    if (!activityEditor || !activityForm) return;
    const { activity } = activityEditor;
    const originalName = activity.activity?.name || activity.customName || '';
    const name = activityForm.name.trim();
    if (!name) return;
    const payload = {
      date: activityForm.date,
      startTime: activityForm.startTime,
      durationMinutes: Number(activityForm.durationMinutes),
      cost: Number(activityForm.cost),
      notes: activityForm.notes,
    };
    if (name !== originalName) {
      payload.activityId = null;
      payload.customName = name;
    }
    const updated = await alter(() => tripApi.activities.update(id, activity._id, payload));
    if (updated) {
      setActivityEditor(null);
      setActivityForm(null);
    }
  };

  if (state.loading) return <section className="mx-auto max-w-6xl px-4 py-10"><LoadingState label="Loading your itinerary" /></section>;
  if (state.error && !state.trip) return <section className="mx-auto max-w-6xl px-4 py-10"><ErrorState error={state.error} retry={load} /></section>;

  const trip = state.trip;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><Button to="/trips" variant="ghost" size="sm" leftIcon={<ChevronLeft className="size-4" />}>My trips</Button><h1 className="mt-3 font-display text-4xl font-semibold">{trip.name}</h1><p className="mt-2 text-sm text-ink-500">Build your route one stop and one good idea at a time.{trip.destinationCountry ? ` This trip is limited to ${trip.destinationCountry}.` : ''}</p></div>
        <div className="flex flex-wrap gap-2"><Button to={`/trips/${id}/budget`} variant="outline">Budget</Button><Button to={`/trips/${id}`} variant="dark">View itinerary <ChevronRight className="size-4" /></Button></div>
      </div>
      {state.error && <div className="mt-5 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-700">{state.error.message}</div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {trip.stops.length === 0 ? <EmptyState title="Add your first city" description="Choose a city from the country-specific list. Each stop gets its own dates, budget, and editable activities." action={<Button onClick={() => setAddStopOpen(true)} leftIcon={<CirclePlus className="size-4" />}>Add a city</Button>} /> : trip.stops.map((stop, index) => <StopEditor key={stop._id} trip={trip} stop={stop} index={index} last={trip.stops.length - 1} saving={saving} onUpdate={updateStop} onDelete={() => { if (window.confirm(`Remove ${stop.city.name} and its activities?`)) alter(() => tripApi.stops.remove(id, stop._id)); }} onMove={(direction) => reorderStops(index, direction)} onActivity={() => setActivityStop(stop)} onEditActivity={(activity) => openActivityEditor(stop, activity)} onDeleteActivity={(activity) => { if (window.confirm(`Remove ${activity.activity?.name || activity.customName}?`)) alter(() => tripApi.activities.remove(id, activity._id)); }} />)}
          <Button onClick={() => setAddStopOpen(true)} variant="outline" fullWidth leftIcon={<Plus className="size-4" />}>Add another city</Button>
        </div>
        <aside className="h-fit rounded-4xl border border-line bg-surface p-5 shadow-lift lg:sticky lg:top-28"><p className="text-xs font-semibold tracking-[.14em] text-clay-600 uppercase">Live budget</p><h2 className="mt-2 font-display text-3xl font-semibold">{money(trip.stops.reduce((sum, stop) => sum + stop.activities.reduce((activitySum, activity) => activitySum + (activity.cost || 0), 0), 0), trip.currency)}</h2><p className="mt-1 text-sm text-ink-500">Activities added so far</p><div className="mt-5 space-y-3 border-t border-line pt-5 text-sm"><div className="flex justify-between"><span className="text-ink-500">Cities</span><strong>{trip.stops.length}</strong></div><div className="flex justify-between"><span className="text-ink-500">Activities</span><strong>{trip.stops.reduce((sum, stop) => sum + stop.activities.length, 0)}</strong></div><div className="flex justify-between"><span className="text-ink-500">Budget limit</span><strong>{trip.budgetLimit ? money(trip.budgetLimit, trip.currency) : 'Not set'}</strong></div></div><Button to={`/trips/${id}/budget`} variant="dark" fullWidth className="mt-6">Open full budget</Button></aside>
      </div>

      {addStopOpen && <Modal title="Add a city" onClose={() => setAddStopOpen(false)}>{!pickerCountry ? <div><p className="rounded-xl bg-clay-50 p-3 text-sm text-clay-700">Choose this trip’s country first. The city list will then stay limited to that country.</p><label className="mt-4 mb-2 block text-sm font-medium text-ink-700">Trip country</label><select value="" onChange={setTripCountry} className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-sm"><option value="">Choose one country</option>{availableCountries.map((country) => <option key={country} value={country}>{country}</option>)}</select></div> : <><Input label="Search cities" value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder={`Search ${pickerCountry} cities`} autoFocus /><p className="mt-3 rounded-xl bg-moss-50 p-3 text-xs text-moss-800">Only cities in {pickerCountry} are available for this trip.</p><div className="mt-4 space-y-2">{cityResults.map((city) => <button type="button" key={city._id} disabled={trip.stops.some((stop) => stop.city._id === city._id)} onClick={() => addStop(city)} className="flex w-full items-center justify-between rounded-2xl border border-line p-4 text-left hover:border-clay-300 hover:bg-canvas disabled:opacity-45"><span><strong className="font-display text-lg">{city.name}</strong><span className="ml-2 text-sm text-ink-500">{city.country}</span></span><span className="text-xs text-clay-700">{trip.stops.some((stop) => stop.city._id === city._id) ? 'Added' : 'Add'}</span></button>)}{!cityResults.length && <p className="rounded-2xl bg-canvas p-4 text-sm text-ink-500">No matching cities found.</p>}</div></>}</Modal>}
      {activityStop && <Modal title={`Add to ${activityStop.city.name}`} onClose={() => setActivityStop(null)}><div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">{catalog.map((activity) => <button key={activity._id} type="button" onClick={() => addCatalogActivity(activity)} className="flex w-full items-start justify-between rounded-2xl border border-line p-4 text-left hover:border-clay-300 hover:bg-canvas"><span><strong className="block text-sm text-ink-900">{activity.name}</strong><span className="mt-1 block text-xs text-ink-500">{activity.type} · {activity.durationMinutes} min</span></span><strong className="text-sm text-clay-700">{money(activity.cost, trip.currency)}</strong></button>)}</div><details className="mt-4 rounded-2xl bg-canvas p-4"><summary className="cursor-pointer text-sm font-medium text-ink-700">Add a custom activity</summary><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addCustomActivity}><Input label="Activity name" name="customName" required wrapperClassName="sm:col-span-2" /><Input label="Date" type="date" name="date" defaultValue={dateInput(activityStop.startDate)} min={dateInput(activityStop.startDate)} max={dateInput(activityStop.endDate)} required /><Input label="Time" type="time" name="startTime" defaultValue="10:00" /><Input label="Cost" type="number" name="cost" min="0" defaultValue="0" /><Input label="Minutes" type="number" name="durationMinutes" min="0" defaultValue="60" /><Button type="submit" className="sm:col-span-2">Add custom activity</Button></form></details></Modal>}
      {activityEditor && activityForm && <ActivityEditor stop={activityEditor.stop} activity={activityEditor.activity} form={activityForm} currency={trip.currency} saving={saving} onChange={(name, value) => setActivityForm((old) => ({ ...old, [name]: value }))} onClose={() => { setActivityEditor(null); setActivityForm(null); }} onSubmit={saveActivity} />}
    </section>
  );
};

const StopEditor = ({ trip, stop, index, last, saving, onUpdate, onDelete, onMove, onActivity, onEditActivity, onDeleteActivity }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ startDate: dateInput(stop.startDate), endDate: dateInput(stop.endDate), notes: stop.notes || '', transportCost: stop.transportCost || 0, accommodationCost: stop.accommodationCost || 0, mealBudgetPerDay: stop.mealBudgetPerDay || 0 });
  const submit = (event) => { event.preventDefault(); onUpdate(stop, { ...form, transportCost: Number(form.transportCost), accommodationCost: Number(form.accommodationCost), mealBudgetPerDay: Number(form.mealBudgetPerDay) }); setEditing(false); };
  return <article className="overflow-hidden rounded-4xl border border-line bg-surface shadow-soft"><div className="flex items-start justify-between gap-3 border-b border-line bg-canvas/70 p-5"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-2xl bg-clay-100 text-sm font-semibold text-clay-700">{index + 1}</span><div><h2 className="font-display text-2xl font-semibold">{stop.city.name}</h2><p className="text-sm text-ink-500">{stop.city.country}</p></div></div><div className="flex gap-1"><button type="button" disabled={index === 0 || saving} onClick={() => onMove(-1)} className="rounded-xl p-2 text-ink-500 hover:bg-canvas-deep disabled:opacity-30" aria-label="Move city earlier"><ArrowUp className="size-4" /></button><button type="button" disabled={index === last || saving} onClick={() => onMove(1)} className="rounded-xl p-2 text-ink-500 hover:bg-canvas-deep disabled:opacity-30" aria-label="Move city later"><ArrowDown className="size-4" /></button><button type="button" onClick={() => setEditing((value) => !value)} className="rounded-xl p-2 text-ink-500 hover:bg-canvas-deep" aria-label="Edit stop"><Pencil className="size-4" /></button><button type="button" onClick={onDelete} className="rounded-xl p-2 text-clay-600 hover:bg-clay-50" aria-label="Delete stop"><Trash2 className="size-4" /></button></div></div>{editing && <form className="grid gap-4 border-b border-line p-5 sm:grid-cols-2" onSubmit={submit}><Input label="Arrival" type="date" value={form.startDate} onChange={(event) => setForm((old) => ({ ...old, startDate: event.target.value }))} required /><Input label="Departure" type="date" value={form.endDate} onChange={(event) => setForm((old) => ({ ...old, endDate: event.target.value }))} required /><Input label="Transport" type="number" min="0" value={form.transportCost} onChange={(event) => setForm((old) => ({ ...old, transportCost: event.target.value }))} /><Input label="Accommodation" type="number" min="0" value={form.accommodationCost} onChange={(event) => setForm((old) => ({ ...old, accommodationCost: event.target.value }))} /><Input label="Meals / day" type="number" min="0" value={form.mealBudgetPerDay} onChange={(event) => setForm((old) => ({ ...old, mealBudgetPerDay: event.target.value }))} /><div className="flex items-end"><Button type="submit" loading={saving} fullWidth leftIcon={<Save className="size-4" />}>Save stop</Button></div><TextArea label="Notes" wrapperClassName="sm:col-span-2" rows={2} value={form.notes} onChange={(event) => setForm((old) => ({ ...old, notes: event.target.value }))} /></form>}<div className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-semibold">Activities</h3><p className="mt-1 text-xs text-ink-500">Select a day activity to edit every detail.</p></div><Button size="sm" onClick={onActivity} leftIcon={<Plus className="size-3.5" />}>Add activity</Button></div>{stop.activities.length ? <div className="mt-4 space-y-2">{stop.activities.map((activity) => <div key={activity._id} className="flex items-center justify-between gap-4 rounded-2xl border border-line p-3"><button type="button" onClick={() => onEditActivity(activity)} className="min-w-0 flex-1 text-left"><strong className="block text-sm">{activity.activity?.name || activity.customName}</strong><p className="mt-0.5 text-xs text-ink-500">{dateInput(activity.date)} {activity.startTime ? `· ${activity.startTime}` : ''} · {activity.durationMinutes} min</p></button><div className="flex items-center gap-1"><strong className="mr-2 text-sm text-clay-700">{money(activity.cost, trip.currency)}</strong><button type="button" onClick={() => onEditActivity(activity)} className="rounded-lg p-1.5 text-ink-500 hover:bg-canvas" aria-label={`Edit ${activity.activity?.name || activity.customName}`}><Pencil className="size-4" /></button><button type="button" onClick={() => onDeleteActivity(activity)} className="rounded-lg p-1.5 text-ink-500 hover:bg-clay-50 hover:text-clay-600" aria-label="Remove activity"><X className="size-4" /></button></div></div>)}</div> : <p className="mt-4 rounded-2xl bg-canvas p-4 text-sm text-ink-500">No activities yet. Add something memorable.</p>}</div></article>;
};

const ActivityEditor = ({ stop, activity, form, currency, saving, onChange, onClose, onSubmit }) => <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/45 p-4" role="dialog" aria-modal="true" aria-label="Edit activity"><form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-4xl bg-surface p-6 shadow-lift" onSubmit={onSubmit}><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-clay-600">{stop.city.name} activity</p><h2 className="mt-1 font-display text-2xl font-semibold">Edit {activity.activity?.name || activity.customName}</h2><p className="mt-1 text-sm text-ink-500">Choose any day during this city stay and update every activity detail.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-500 hover:bg-canvas" aria-label="Close editor"><X className="size-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Activity name" value={form.name} onChange={(event) => onChange('name', event.target.value)} required wrapperClassName="sm:col-span-2" /><Input label="Day in this city" type="date" min={dateInput(stop.startDate)} max={dateInput(stop.endDate)} value={form.date} onChange={(event) => onChange('date', event.target.value)} required /><Input label="Start time" type="time" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} /><Input label="Duration (minutes)" type="number" min="0" max="1440" value={form.durationMinutes} onChange={(event) => onChange('durationMinutes', event.target.value)} required /><Input label={`Cost (${currency})`} type="number" min="0" step="0.01" value={form.cost} onChange={(event) => onChange('cost', event.target.value)} required /><TextArea label="Notes" rows={3} value={form.notes} onChange={(event) => onChange('notes', event.target.value)} wrapperClassName="sm:col-span-2" placeholder="Reservations, meeting point, or anything to remember." /></div><div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving} leftIcon={<Save className="size-4" />}>Save activity</Button></div></form></div>;

const Modal = ({ title, children, onClose }) => <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/45 p-4" role="dialog" aria-modal="true" aria-label={title}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-4xl bg-surface p-6 shadow-lift"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">{title}</h2><button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-500 hover:bg-canvas" aria-label="Close"><X className="size-5" /></button></div><div className="mt-5">{children}</div></div></div>;

export default ItineraryBuilderPage;
