import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, Pencil, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { Button, ErrorState, Input, LoadingState, TextArea } from '../../components/ui/index.js';
import { money } from '../../lib/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const keyFor = (date) => date.toISOString().slice(0, 10);
const gridDates = (month) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

const CalendarPage = () => {
  const { id } = useParams();
  usePageTitle('Trip calendar');
  const [state, setState] = useState({ loading: true, error: null, itinerary: null });
  const [month, setMonth] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const itinerary = await tripApi.itinerary(id);
      setState({ loading: false, error: null, itinerary });
      setMonth((current) => current || new Date(`${itinerary.trip.startDate.slice(0, 10)}T12:00:00`));
    } catch (error) {
      setState((old) => ({ ...old, loading: false, error: toApiError(error) }));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  const eventMap = useMemo(
    () => new Map((state.itinerary?.days || []).map((day) => [day.date, day.activities])),
    [state.itinerary]
  );

  const moveActivity = async (targetDate) => {
    if (!dragging || targetDate === dragging.date) return;
    try {
      await tripApi.activities.update(id, dragging._id, { date: targetDate });
      await load();
    } catch (error) {
      setState((old) => ({ ...old, error: toApiError(error) }));
    } finally {
      setDragging(null);
    }
  };

  const openEditor = (activity, day) => {
    setEditing({ ...activity, date: day });
    setEditForm({
      name: activity.name,
      date: day,
      startTime: activity.startTime || '',
      durationMinutes: String(activity.durationMinutes ?? 60),
      cost: String(activity.cost ?? 0),
      notes: activity.notes || '',
    });
  };

  const saveActivity = async (event) => {
    event.preventDefault();
    if (!editing || !editForm) return;
    setSaving(true);
    try {
      const payload = {
        date: editForm.date,
        startTime: editForm.startTime,
        durationMinutes: Number(editForm.durationMinutes),
        cost: Number(editForm.cost),
        notes: editForm.notes,
      };
      if (editForm.name.trim() !== editing.name) {
        payload.activityId = null;
        payload.customName = editForm.name.trim();
      }
      await tripApi.activities.update(id, editing._id, payload);
      await load();
      setEditing(null);
      setEditForm(null);
    } catch (error) {
      setState((old) => ({ ...old, error: toApiError(error) }));
    } finally {
      setSaving(false);
    }
  };

  if (state.loading || !month) return <section className="mx-auto max-w-6xl px-4 py-10"><LoadingState label="Placing your plans on the calendar" /></section>;
  if (state.error && !state.itinerary) return <section className="mx-auto max-w-6xl px-4 py-10"><ErrorState error={state.error} retry={load} /></section>;

  const days = gridDates(month);
  const heading = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month);
  const tripStart = state.itinerary.trip.startDate.slice(0, 10);
  const tripEnd = state.itinerary.trip.endDate.slice(0, 10);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <Button to={`/trips/${id}`} variant="ghost" size="sm" leftIcon={<ChevronLeft className="size-4" />}>Itinerary</Button>
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-clay-600">Move and refine every day</p><h1 className="mt-1 font-display text-4xl font-semibold">Calendar</h1></div><Button to={`/trips/${id}/build`} variant="outline">Edit itinerary</Button></div>
      {state.error && <div className="mt-4 rounded-2xl border border-clay-200 bg-clay-50 p-3 text-sm text-clay-700">{state.error.message}</div>}
      <div className="mt-7 overflow-hidden rounded-4xl border border-line bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-line p-4 sm:p-6"><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))} className="rounded-xl p-2 hover:bg-canvas" aria-label="Previous month"><ChevronLeft className="size-5" /></button><h2 className="font-display text-2xl font-semibold">{heading}</h2><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))} className="rounded-xl p-2 hover:bg-canvas" aria-label="Next month"><ChevronRight className="size-5" /></button></div>
        <div className="grid grid-cols-7 border-b border-line bg-canvas text-center text-[11px] font-semibold tracking-[.12em] text-ink-500 uppercase">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => <div key={name} className="p-3">{name}</div>)}</div>
        <div className="grid grid-cols-7">{days.map((day) => {
          const dayKey = keyFor(day);
          const inMonth = day.getMonth() === month.getMonth();
          const inTrip = dayKey >= tripStart && dayKey <= tripEnd;
          return <div key={dayKey} onDragOver={(event) => event.preventDefault()} onDrop={() => moveActivity(dayKey)} className={`min-h-28 border-r border-b border-line p-2 last:border-r-0 sm:min-h-36 ${inMonth ? 'bg-surface' : 'bg-canvas/55'} ${inTrip ? 'bg-moss-50/50' : ''}`}><div className="flex justify-between"><span className={`grid size-6 place-items-center rounded-full text-xs ${dayKey === keyFor(new Date()) ? 'bg-clay-500 text-white' : inMonth ? 'text-ink-700' : 'text-ink-300'}`}>{day.getDate()}</span>{inTrip && <span className="mt-1 size-1.5 rounded-full bg-moss-500" />}</div><div className="mt-2 space-y-1">{(eventMap.get(dayKey) || []).map((activity) => <button type="button" draggable onDragStart={() => setDragging({ ...activity, date: dayKey })} onClick={() => openEditor(activity, dayKey)} key={activity._id} className="flex w-full items-center gap-1 truncate rounded-lg bg-clay-100 px-1.5 py-1 text-left text-[10px] font-medium text-clay-700 hover:bg-clay-200" title={`Edit ${activity.name} · ${money(activity.cost, state.itinerary.trip.currency)}`}><GripVertical className="size-2.5 shrink-0" /><span className="truncate">{activity.name}</span></button>)}</div></div>;
        })}</div>
      </div>
      <p className="mt-4 text-sm text-ink-500">Drag an activity to another day, or select it to edit its name, day, time, duration, cost, and notes.</p>

      {editing && editForm && <ActivityEditor activity={editing} form={editForm} currency={state.itinerary.trip.currency} saving={saving} onChange={(name, value) => setEditForm((old) => ({ ...old, [name]: value }))} onClose={() => { setEditing(null); setEditForm(null); }} onSubmit={saveActivity} />}
    </section>
  );
};

const ActivityEditor = ({ activity, form, currency, saving, onChange, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/45 p-4" role="dialog" aria-modal="true" aria-label="Edit activity">
    <form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-4xl bg-surface p-6 shadow-lift" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-clay-600">Day activity</p><h2 className="mt-1 font-display text-2xl font-semibold">Edit {activity.name}</h2><p className="mt-1 text-sm text-ink-500">Update the plan without leaving the calendar.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-500 hover:bg-canvas" aria-label="Close editor"><X className="size-5" /></button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input label="Activity name" value={form.name} onChange={(event) => onChange('name', event.target.value)} required wrapperClassName="sm:col-span-2" />
        <Input label="Day" type="date" value={form.date} onChange={(event) => onChange('date', event.target.value)} required />
        <Input label="Start time" type="time" value={form.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
        <Input label="Duration (minutes)" type="number" min="0" max="1440" value={form.durationMinutes} onChange={(event) => onChange('durationMinutes', event.target.value)} required />
        <Input label={`Cost (${currency})`} type="number" min="0" step="0.01" value={form.cost} onChange={(event) => onChange('cost', event.target.value)} required />
        <TextArea label="Notes" rows={3} value={form.notes} onChange={(event) => onChange('notes', event.target.value)} wrapperClassName="sm:col-span-2" placeholder="Reservations, meeting point, or anything to remember." />
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving} leftIcon={<Pencil className="size-4" />}>Save activity</Button></div>
    </form>
  </div>
);

export default CalendarPage;
