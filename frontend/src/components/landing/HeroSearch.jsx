import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, WalletCards } from 'lucide-react';

import { ROUTES } from '../../lib/constants.js';
import { DateRangePicker } from '../ui/DateRangePicker.jsx';

/* The global focus ring is brand-500 — deep forest, which all but disappears on
   this dark glass panel, so every control inside it re-points the ring at cream. */
const fieldClass =
  'h-11 w-full min-w-0 max-w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-medium text-white outline-none transition-colors placeholder:text-white/55 hover:border-white/35 focus:border-white/60 focus:bg-white/15 focus-visible:outline-canvas';

/* Poppins, 600, 11px, uppercase — the one label voice on the hero panel. */
const labelClass =
  'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70';

export const HeroSearch = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  const submit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (budget) params.set('budget', budget);

    navigate(`${ROUTES.newTrip}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="grid w-full min-w-0 max-w-full gap-3 rounded-2xl border border-white/20 bg-[#181c18]/60 p-4 backdrop-blur-xl sm:grid-cols-2 xl:max-w-[820px] xl:grid-cols-[1.2fr_1.5fr_0.8fr_auto] xl:items-end"
    >
      <label className="block min-w-0">
        <span className={labelClass}>
          <MapPin className="size-3.5" aria-hidden />
          Destination
        </span>
        <input
          type="search"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Lisbon, Portugal"
          className={fieldClass}
        />
      </label>

      {/* One calendar instead of two `type="date"` boxes. The panel is dark
          glass, so the trigger takes `tone="dark"`; the calendar itself stays
          on paper, because a month grid is dense reading and cream-on-glass is
          hard work. The label is rendered here rather than by the picker so it
          keeps the hero's own label voice. */}
      <div className="min-w-0 sm:col-span-2 xl:col-span-1">
        <span className={labelClass}>
          <CalendarDays className="size-3.5" aria-hidden />
          Travel dates
        </span>
        <DateRangePicker
          tone="dark"
          label={null}
          className="[&>button]:h-11"
          startDate={startDate}
          endDate={endDate}
          onChange={(range) => {
            setStartDate(range.startDate);
            setEndDate(range.endDate);
          }}
        />
      </div>

      <label className="block min-w-0">
        <span className={labelClass}>
          <WalletCards className="size-3.5" aria-hidden />
          Budget
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="100"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          placeholder="USD"
          className={fieldClass}
        />
      </label>

      <button
        type="submit"
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-canvas px-6 text-sm font-semibold whitespace-nowrap text-ink-900 transition-colors hover:bg-white focus-visible:outline-canvas sm:col-span-2 xl:col-span-1"
      >
        Start planning
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
};
