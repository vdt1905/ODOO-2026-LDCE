import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPinned, Sparkles, WalletCards } from 'lucide-react';
import { Button, EmptyState, ErrorState, LoadingState } from '../../components/ui/index.js';
import { TripCard } from '../../components/trip/TripCard.jsx';
import { tripApi } from '../../api/trip.api.js';
import { cityApi } from '../../api/city.api.js';
import { toApiError } from '../../api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { date, money } from '../../lib/format.js';
import { gradientFor } from '../../lib/constants.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const DashboardPage = () => {
  usePageTitle('Your travel dashboard');
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, error: null, summary: null, trips: [], cities: [] });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const [summary, tripRows, cities] = await Promise.all([
        tripApi.summary(),
        tripApi.list({ limit: 6, sort: 'start-desc' }),
        cityApi.popular(6),
      ]);
      setState({ loading: false, error: null, summary, trips: tripRows.items, cities });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: toApiError(error) }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (state.loading) return <section className="mx-auto max-w-6xl px-4 py-12"><LoadingState label="Loading your dashboard" /></section>;
  if (state.error) return <section className="mx-auto max-w-6xl px-4 py-12"><ErrorState error={state.error} retry={load} /></section>;

  const { summary } = state;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-12">
      <div className="rounded-4xl bg-ink-900 px-6 py-8 text-canvas shadow-lift sm:px-9 sm:py-10">
        <p className="text-sm text-clay-200">Good to see you, {user?.firstName}.</p>
        <div className="mt-2 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><h1 className="max-w-xl font-display text-3xl font-semibold sm:text-4xl">Your next adventure deserves a thoughtful plan.</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-canvas/70">Build a route, price every day, and keep the whole journey in one calm place.</p></div>
          <Button to="/trips/new" variant="light" leftIcon={<Sparkles className="size-4" />}>Plan a trip</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={MapPinned} label="Trips planned" value={summary.tripCount} detail={`${summary.citiesPlanned} cities`} />
        <Metric icon={CalendarDays} label="Days away" value={summary.totalDaysPlanned} detail={`${summary.byStatus.upcoming} upcoming`} />
        <Metric icon={WalletCards} label="Planned spend" value={money(summary.totalPlannedCost)} detail={`${money(summary.avgTripCost)} average`} />
        <Metric icon={Sparkles} label="Next departure" value={summary.nextTrip ? `${Math.max(0, summary.nextTrip.daysUntil)}d` : '—'} detail={summary.nextTrip?.name || 'Choose a destination'} />
      </div>

      {summary.nextTrip && <div className="mt-8 rounded-4xl border border-moss-100 bg-moss-50 p-6 sm:flex sm:items-center sm:justify-between"><div><p className="text-xs font-semibold tracking-[.16em] text-moss-800 uppercase">Next trip</p><h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">{summary.nextTrip.name}</h2><p className="mt-1 text-sm text-ink-500">{date(summary.nextTrip.startDate)} · {summary.nextTrip.cities.join(' → ') || 'Start adding cities'}</p></div><Button to={`/trips/${summary.nextTrip._id}/build`} variant="dark" className="mt-4 sm:mt-0">Open builder <ArrowRight className="size-4" /></Button></div>}

      <SectionHeading title="Recent trips" action={<Button to="/trips" variant="ghost" size="sm">All trips <ArrowRight className="size-3.5" /></Button>} />
      {state.trips.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{state.trips.map((trip) => <TripCard key={trip._id} trip={trip} />)}</div> : <EmptyState title="Your first trip starts here" description="Choose dates, then make the route yours with cities and activities." action={<Button to="/trips/new">Plan a trip</Button>} />}

      <SectionHeading title="Popular right now" action={<Button to="/cities" variant="ghost" size="sm">Explore cities <ArrowRight className="size-3.5" /></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.cities.map((city) => <div key={city._id} className={`min-h-36 rounded-4xl bg-gradient-to-br p-5 text-white shadow-soft ${gradientFor(city.name)}`} style={city.imageUrl ? { backgroundImage: `linear-gradient(rgba(23,20,15,.14), rgba(23,20,15,.68)), url(${city.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><p className="text-xs text-white/75">{city.country}</p><h3 className="mt-1 font-display text-2xl font-semibold">{city.name}</h3><p className="mt-5 text-xs text-white/80">Popularity {city.popularity}/100</p></div>)}</div>
    </section>
  );
};

const Metric = ({ icon: Icon, label, value, detail }) => <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft"><Icon className="size-5 text-clay-500" /><p className="mt-4 text-xs text-ink-500">{label}</p><p className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</p><p className="mt-1 text-xs text-ink-500">{detail}</p></div>;
const SectionHeading = ({ title, action }) => <div className="mb-4 mt-10 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold text-ink-900">{title}</h2>{action}</div>;

export default DashboardPage;
