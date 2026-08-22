import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, MapPin, PieChart, TrendingUp, WalletCards } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { Button, ErrorState, LoadingState } from '../../components/ui/index.js';
import { money } from '../../lib/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const categories = [
  { key: 'transport', label: 'Transport', color: '#8b7bb8', className: 'bg-cat-transport' },
  { key: 'stay', label: 'Stay', color: '#4fa398', className: 'bg-cat-stay' },
  { key: 'meals', label: 'Meals', color: '#d9aa53', className: 'bg-cat-meals' },
  { key: 'activities', label: 'Activities', color: '#ce7440', className: 'bg-cat-activities' },
];

const BudgetPage = () => {
  const { id } = useParams();
  usePageTitle('Trip budget');
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: null }));
    try {
      setState({ loading: false, error: null, data: await tripApi.budget(id) });
    } catch (error) {
      setState((old) => ({ ...old, loading: false, error: toApiError(error) }));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  const categoryRows = useMemo(() => state.data ? categories.map((category) => ({ ...category, value: state.data.byCategory[category.key] || 0 })) : [], [state.data]);

  if (state.loading) return <section className="mx-auto max-w-6xl px-4 py-10"><LoadingState label="Adding up your trip" /></section>;
  if (state.error) return <section className="mx-auto max-w-6xl px-4 py-10"><ErrorState error={state.error} retry={load} /></section>;

  const budget = state.data;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <Button to={`/trips/${id}`} variant="ghost" size="sm" leftIcon={<ChevronLeft className="size-4" />}>Itinerary</Button>
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm text-clay-600">Every dollar has a place</p><h1 className="mt-1 font-display text-4xl font-semibold">Trip budget</h1><p className="mt-2 text-sm text-ink-500">See the category split, city totals, and daily spending pattern at a glance.</p></div>
        <Button to={`/trips/${id}/build`} variant="outline">Edit costs</Button>
      </div>

      {budget.isOverBudget && <div className="mt-6 flex gap-3 rounded-3xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-700"><AlertTriangle className="size-5 shrink-0" /><span>You are {money(Math.abs(budget.remaining), budget.currency)} over your budget limit. Adjust a stop or activity to bring it back in range.</span></div>}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Estimated total" value={money(budget.total, budget.currency)} icon={WalletCards} />
        <Kpi label="Per day" value={money(budget.avgPerDay, budget.currency)} icon={PieChart} />
        <Kpi label="Most expensive" value={budget.mostExpensiveStop?.city || '—'} detail={budget.mostExpensiveStop ? money(budget.mostExpensiveStop.total, budget.currency) : ''} icon={MapPin} />
        <Kpi label="Remaining" value={budget.remaining === null ? 'No limit' : money(budget.remaining, budget.currency)} detail={budget.budgetLimit ? `of ${money(budget.budgetLimit, budget.currency)}` : 'Set a limit in trip settings'} icon={AlertTriangle} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-4xl border border-line bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-2"><PieChart className="size-5 text-clay-500" /><h2 className="font-display text-2xl font-semibold">Budget classification</h2></div>
          <p className="mt-1 text-sm text-ink-500">How the estimated trip cost is divided.</p>
          <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row"><CategoryDonut rows={categoryRows} total={budget.total} currency={budget.currency} /><div className="w-full space-y-4">{categoryRows.map((category) => <CategoryLegend key={category.key} category={category} total={budget.total} currency={budget.currency} />)}</div></div>
        </section>
        <section className="rounded-4xl border border-line bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-2"><TrendingUp className="size-5 text-clay-500" /><h2 className="font-display text-2xl font-semibold">Spend by city</h2></div>
          <p className="mt-1 text-sm text-ink-500">Tall bars show each city total; colours show its classifications.</p>
          <CityGraph stops={budget.byStop} currency={budget.currency} />
        </section>
      </div>

      <section className="mt-6 rounded-4xl border border-line bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><div><div className="flex items-center gap-2"><TrendingUp className="size-5 text-clay-500" /><h2 className="font-display text-2xl font-semibold">Daily spend trend</h2></div><p className="mt-1 text-sm text-ink-500">A day-by-day graph highlights the expensive parts of your itinerary.</p></div><span className="text-sm text-ink-500">{budget.dailyAllowance ? `Daily allowance ${money(budget.dailyAllowance, budget.currency)}` : 'No daily limit set'}</span></div>
        <DailyGraph rows={budget.dailySpend} allowance={budget.dailyAllowance} currency={budget.currency} />
      </section>
    </section>
  );
};

const Kpi = ({ label, value, detail, icon: Icon }) => <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft"><Icon className="size-5 text-clay-500" /><p className="mt-4 text-xs text-ink-500">{label}</p><p className="mt-1 truncate font-display text-2xl font-semibold">{value}</p>{detail && <p className="mt-1 text-xs text-ink-500">{detail}</p>}</div>;

const CategoryDonut = ({ rows, total, currency }) => {
  const safeTotal = Math.max(1, total || 0);
  let cursor = 0;
  const slices = rows.map((row) => {
    const next = cursor + (row.value / safeTotal) * 100;
    const slice = `${row.color} ${cursor}% ${next}%`;
    cursor = next;
    return slice;
  });
  const style = total ? { background: `conic-gradient(${slices.join(', ')})` } : { background: '#eee8df' };
  return <div className="relative grid size-48 shrink-0 place-items-center rounded-full" style={style}><div className="grid size-31 place-items-center rounded-full bg-surface text-center shadow-soft"><span className="text-xs text-ink-500">Total</span><strong className="mt-1 px-3 font-display text-xl leading-tight">{money(total, currency)}</strong></div></div>;
};

const CategoryLegend = ({ category, total, currency }) => {
  const percent = total ? Math.round((category.value / total) * 100) : 0;
  return <div><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-ink-600"><i className="size-3 rounded-full" style={{ backgroundColor: category.color }} />{category.label}</span><strong>{money(category.value, currency)} <span className="font-normal text-ink-500">{percent}%</span></strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas-deep"><div className={`h-full rounded-full ${category.className}`} style={{ width: `${percent}%` }} /></div></div>;
};

const CityGraph = ({ stops, currency }) => {
  const highest = Math.max(1, ...stops.map((stop) => stop.total));
  if (!stops.length) return <p className="mt-8 rounded-2xl bg-canvas p-4 text-sm text-ink-500">Add stops to compare city costs.</p>;
  return <><div className="mt-7 flex h-56 items-end gap-3 border-b border-line px-2 pb-2">{stops.map((stop) => <div key={stop.stopId} className="group flex min-w-0 flex-1 flex-col justify-end" title={`${stop.city}: ${money(stop.total, currency)}`}><div className="relative flex min-h-2 flex-col overflow-hidden rounded-t-xl bg-canvas-deep transition-transform group-hover:scale-x-105" style={{ height: `${Math.max(4, (stop.total / highest) * 100)}%` }}><Segment value={stop.transport} total={stop.total} className="bg-cat-transport" /><Segment value={stop.stay} total={stop.total} className="bg-cat-stay" /><Segment value={stop.meals} total={stop.total} className="bg-cat-meals" /><Segment value={stop.activities} total={stop.total} className="bg-cat-activities" /></div></div>)}</div><div className="mt-3 flex gap-3 overflow-x-auto pb-1">{stops.map((stop) => <div key={stop.stopId} className="min-w-17 flex-1 text-center"><strong className="block truncate text-xs">{stop.city}</strong><span className="text-[11px] text-ink-500">{money(stop.total, currency)}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-500">{categories.map((category) => <span key={category.key} className="flex items-center gap-1.5"><i className={`size-2.5 rounded-full ${category.className}`} />{category.label}</span>)}</div></>;
};

const Segment = ({ value, total, className }) => value ? <span className={className} style={{ height: `${(value / total) * 100}%` }} /> : null;

const DailyGraph = ({ rows, allowance, currency }) => {
  const max = Math.max(1, allowance || 0, ...rows.map((row) => row.total));
  const width = 760;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 28, left: 18 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  const coordinates = rows.map((row, index) => ({ x: padding.left + (rows.length === 1 ? graphWidth / 2 : (index / (rows.length - 1)) * graphWidth), y: padding.top + graphHeight - (row.total / max) * graphHeight, ...row }));
  const line = coordinates.map((row) => `${row.x},${row.y}`).join(' ');
  const area = coordinates.length ? `${padding.left},${padding.top + graphHeight} ${line} ${coordinates.at(-1).x},${padding.top + graphHeight}` : '';
  const allowanceY = allowance ? padding.top + graphHeight - (allowance / max) * graphHeight : null;
  if (!rows.length) return <p className="mt-6 rounded-2xl bg-canvas p-4 text-sm text-ink-500">Add activities to see a daily spend trend.</p>;
  return <div className="mt-6"><svg viewBox={`0 0 ${width} ${height}`} className="h-58 w-full" role="img" aria-label="Daily spending line graph"><line x1={padding.left} x2={width - padding.right} y1={padding.top + graphHeight} y2={padding.top + graphHeight} stroke="#d9d3c9" strokeWidth="1" />{allowanceY !== null && <line x1={padding.left} x2={width - padding.right} y1={allowanceY} y2={allowanceY} stroke="#cc7441" strokeDasharray="6 5" strokeWidth="2" />}{area && <polygon points={area} fill="rgba(129,152,91,.16)" />}{coordinates.length > 1 && <polyline points={line} fill="none" stroke="#81985b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />}{coordinates.map((row) => <g key={row.date}><circle cx={row.x} cy={row.y} r="5" fill={row.isOverBudget ? '#cc7441' : '#81985b'} stroke="#fff" strokeWidth="3" /><title>{`${row.date}: ${money(row.total, currency)}`}</title></g>)}</svg><div className="flex justify-between text-xs text-ink-500"><span>{rows[0]?.date}</span><span>{allowance ? 'Dashed line: daily allowance' : 'Each point is one day'}</span><span>{rows.at(-1)?.date}</span></div></div>;
};

export default BudgetPage;
