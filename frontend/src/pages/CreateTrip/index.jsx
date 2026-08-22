import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Check, ChevronRight, ImagePlus, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, TextArea } from '../../components/ui/index.js';
import { tripApi } from '../../api/trip.api.js';
import { aiApi } from '../../api/ai.api.js';
import { cityApi } from '../../api/city.api.js';
import { toApiError } from '../../api/client.js';
import { gradientFor } from '../../lib/constants.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const initialManual = {
  name: '', description: '', startDate: '', endDate: '', budgetLimit: '', currency: 'USD', destinationCountry: '',
};
const initialAi = {
  prompt: '', startDate: '', days: 7, travelers: 1, budgetLimit: 2000, currency: 'USD', destinationCountry: '', pace: 'balanced',
};
const currencies = [
  ['USD', 'USD — US Dollar'],
  ['INR', 'INR — Indian Rupee'],
  ['EUR', 'EUR — Euro'],
  ['GBP', 'GBP — British Pound'],
  ['JPY', 'JPY — Japanese Yen'],
  ['AED', 'AED — UAE Dirham'],
  ['AUD', 'AUD — Australian Dollar'],
  ['CAD', 'CAD — Canadian Dollar'],
  ['SGD', 'SGD — Singapore Dollar'],
];

const CreateTripPage = () => {
  usePageTitle('Plan a trip');
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual');
  const [manual, setManual] = useState(initialManual);
  const [ai, setAi] = useState(initialAi);
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [cover, setCover] = useState(null);
  const [availability, setAvailability] = useState({ loading: true, available: false });
  const [status, setStatus] = useState({ loading: false, error: null });

  const load = useCallback(async () => {
    try {
      const [cityRows, aiStatus] = await Promise.all([cityApi.list({ limit: 48, sort: 'name' }), aiApi.status()]);
      setCities(cityRows.items);
      setAvailability({ loading: false, available: aiStatus.available });
    } catch {
      setAvailability({ loading: false, available: false });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const countries = useMemo(
    () => [...new Set(cities.map((city) => city.country))].sort((a, b) => a.localeCompare(b)),
    [cities]
  );
  const availableCities = useMemo(
    () => cities.filter((city) => city.country === manual.destinationCountry),
    [cities, manual.destinationCountry]
  );

  const submitManual = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const data = await tripApi.create({
        ...manual,
        budgetLimit: manual.budgetLimit === '' ? null : Number(manual.budgetLimit),
        cityIds: selected,
      });
      if (cover) await tripApi.updateCover(data.trip._id, cover);
      navigate(`/trips/${data.trip._id}/build`);
    } catch (error) {
      setStatus({ loading: false, error: toApiError(error) });
    }
  };

  const submitAi = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const result = await aiApi.generate({
        ...ai,
        days: Number(ai.days), travelers: Number(ai.travelers), budgetLimit: Number(ai.budgetLimit),
      });
      navigate(`/trips/${result.tripId}/build`, { state: { aiDraft: true } });
    } catch (error) {
      setStatus({ loading: false, error: toApiError(error) });
    }
  };

  const toggleCity = (id) => setSelected((old) => (
    old.includes(id) ? old.filter((cityId) => cityId !== id) : [...old, id]
  ));
  const update = (setter) => (event) => setter((old) => ({ ...old, [event.target.name]: event.target.value }));
  const updateCountry = (event) => {
    const destinationCountry = event.target.value;
    setManual((old) => ({ ...old, destinationCountry }));
    setSelected([]);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <div className="max-w-2xl">
        <p className="text-sm text-clay-600">Your next journey</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Plan a trip</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">Choose one country first, then make every city and day yours.</p>
      </div>

      <div className="mt-8 inline-flex rounded-full border border-line bg-surface p-1">
        <button type="button" onClick={() => setMode('manual')} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'manual' ? 'bg-ink-900 text-canvas' : 'text-ink-500'}`}>Plan it myself</button>
        <button type="button" disabled={!availability.available} onClick={() => setMode('ai')} className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40 ${mode === 'ai' ? 'bg-clay-500 text-white' : 'text-ink-500'}`}>
          {availability.loading ? 'Checking AI…' : <><Sparkles className="mr-1 inline size-3.5" />Plan with AI</>}
        </button>
      </div>

      {status.error && <div className="mt-5 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-700">{status.error.message}</div>}

      {mode === 'manual' ? (
        <form className="mt-6 space-y-6" onSubmit={submitManual}>
          <div className="rounded-4xl border border-line bg-surface p-6 shadow-soft">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Trip name" name="name" value={manual.name} onChange={update(setManual)} required placeholder="Spring in India" />
              <Input label="Budget limit" type="number" min="0" name="budgetLimit" value={manual.budgetLimit} onChange={update(setManual)} placeholder="2500" />
              <Input label="Start date" type="date" name="startDate" value={manual.startDate} onChange={update(setManual)} required />
              <Input label="End date" type="date" name="endDate" value={manual.endDate} onChange={update(setManual)} required />
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Trip country</label>
                <select name="destinationCountry" value={manual.destinationCountry} onChange={updateCountry} required className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-sm">
                  <option value="">Choose one country</option>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
                <p className="mt-1 text-xs text-ink-500">Only cities in this country can be added to this trip.</p>
              </div>
              <CurrencySelect value={manual.currency} onChange={update(setManual)} />
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-ink-700">Cover photo <span className="font-normal text-ink-500">optional</span></label>
                <label className="flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-line bg-canvas px-4 text-sm text-ink-500 hover:bg-canvas-deep">
                  <ImagePlus className="size-4 text-clay-500" />{cover?.name || 'Choose an image'}
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => setCover(event.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <TextArea label="What is this trip about?" name="description" value={manual.description} onChange={update(setManual)} rows={3} placeholder="Food, temples, quiet walks, and a little room to wander." />
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">Start with a few cities</h2>
                <p className="mt-1 text-sm text-ink-500">Select from {manual.destinationCountry || 'your country'} now, or add stops in the builder later.</p>
              </div>
              <span className="text-xs text-ink-500">{selected.length} selected</span>
            </div>
            {!manual.destinationCountry ? (
              <div className="rounded-3xl border border-dashed border-line bg-canvas p-6 text-sm text-ink-500">Choose a trip country to see its cities. For example, choosing India shows only Indian cities.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableCities.map((city) => <button type="button" key={city._id} onClick={() => toggleCity(city._id)} className={`relative overflow-hidden rounded-3xl border p-4 text-left transition ${selected.includes(city._id) ? 'border-clay-500 ring-2 ring-clay-200' : 'border-line bg-surface hover:border-clay-300'}`}>
                  <div className={`absolute inset-0 opacity-15 bg-gradient-to-br ${gradientFor(city.name)}`} />
                  <div className="relative"><MapPin className="size-4 text-clay-600" /><h3 className="mt-6 font-display text-lg font-semibold">{city.name}</h3><p className="text-xs text-ink-500">{city.country}</p>{selected.includes(city._id) && <span className="absolute right-0 bottom-0 grid size-6 place-items-center rounded-full bg-clay-500 text-white"><Check className="size-3.5" /></span>}</div>
                </button>)}
                {!availableCities.length && <p className="rounded-3xl border border-dashed border-line p-5 text-sm text-ink-500">No seeded cities are available for {manual.destinationCountry} yet. You can still create the trip and add them once cities are added to the catalog.</p>}
              </div>
            )}
          </div>
          <Button type="submit" size="lg" loading={status.loading}>Create trip <ChevronRight className="size-4" /></Button>
        </form>
      ) : (
        <form className="mt-6 rounded-4xl border border-clay-200 bg-clay-50 p-6 shadow-soft" onSubmit={submitAi}>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-clay-500 text-white"><Bot className="size-5" /></span><div><h2 className="font-display text-2xl font-semibold">A trip, drafted for you</h2><p className="text-sm text-ink-500">It stays completely editable once it reaches the builder.</p></div></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input label="Start date" type="date" name="startDate" value={ai.startDate} onChange={update(setAi)} required />
            <Input label="Days" type="number" min="1" max="21" name="days" value={ai.days} onChange={update(setAi)} required />
            <Input label="Travellers" type="number" min="1" max="20" name="travelers" value={ai.travelers} onChange={update(setAi)} />
            <Input label="Budget limit" type="number" min="0" name="budgetLimit" value={ai.budgetLimit} onChange={update(setAi)} />
            <CurrencySelect value={ai.currency} onChange={update(setAi)} />
            <div><label className="mb-2 block text-sm font-medium text-ink-700">Trip country</label><select name="destinationCountry" value={ai.destinationCountry} onChange={update(setAi)} required className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-sm"><option value="">Choose one country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></div>
            <div><label className="mb-2 block text-sm font-medium text-ink-700">Pace</label><select name="pace" value={ai.pace} onChange={update(setAi)} className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-sm"><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="packed">Packed</option></select></div>
          </div>
          <TextArea label="Describe your ideal trip" name="prompt" value={ai.prompt} onChange={update(setAi)} required rows={5} placeholder="Ten days in India: food, temples, independent neighbourhood walks, no hiking. Keep it mid-range." />
          <Button type="submit" size="lg" loading={status.loading} leftIcon={<Sparkles className="size-4" />}>{status.loading ? 'Building your itinerary…' : 'Generate my trip'}</Button>
        </form>
      )}
    </section>
  );
};

const CurrencySelect = ({ value, onChange }) => <div><label className="mb-2 block text-sm font-medium text-ink-700">Currency</label><select name="currency" value={value} onChange={onChange} className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-sm">{currencies.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div>;

export default CreateTripPage;
