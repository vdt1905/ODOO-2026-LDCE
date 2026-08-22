import { HeroSearch } from './HeroSearch.jsx';
import { useImmersiveHeader } from '../layout/chromeContext.js';

const STATS = [
  { value: '34k', label: 'Trips planned' },
  { value: '120+', label: 'Countries' },
  { value: '15k', label: 'Shared itineraries' },
];

export const Hero = () => {
  useImmersiveHeader();

  return (
    <section className="relative isolate flex min-h-[94svh] overflow-hidden bg-brand-700 text-white">
      <img
        src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2200&q=80"
        alt="Houseboats crossing the Kerala backwaters"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,20,15,0.64) 0%, rgba(14,20,15,0.18) 35%, rgba(14,20,15,0.76) 100%)',
        }}
      />

      <div className="mx-auto flex w-full min-w-0 max-w-[1320px] flex-1 flex-col overflow-hidden px-4 pt-28 pb-7 sm:px-8 sm:pt-32 sm:pb-10">
        <h1 className="mt-auto w-full whitespace-nowrap text-center font-hero text-[clamp(2.6rem,11.4vw,11rem)] leading-[0.88] font-normal uppercase text-canvas drop-shadow-[0_3px_24px_rgba(10,16,11,0.35)]">
          Map the unseen
        </h1>

        <p className="mt-7 max-w-[380px] text-sm leading-6 font-medium text-white/90 sm:text-[15px]">
          Build multi-city trips stop by stop - dates, activities and cost, all in one plan
          you can share the moment it is ready.
        </p>

        <div className="mt-7 flex min-w-0 flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
          <HeroSearch />

          <dl className="flex w-full flex-wrap gap-x-8 gap-y-3 text-canvas sm:gap-x-10 xl:w-auto xl:shrink-0">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl leading-none font-bold sm:text-4xl">{stat.value}</dd>
                <dt className="mt-1 text-xs font-semibold text-white/75">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};
