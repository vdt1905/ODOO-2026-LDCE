import { MapPin } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { gradientFor } from '../../lib/constants.js';

const costLabel = (index) => {
  if (index <= 35) return 'Budget friendly';
  if (index <= 60) return 'Mid range';
  if (index <= 80) return 'Pricey';
  return 'Expensive';
};

/**
 * Destination tile. Uses the city photo when the catalog has one and falls back
 * to a deterministic gradient, so a card is never a broken image box.
 */
export const CityCard = ({ city, className, onClick }) => {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={cn(
        'group relative aspect-[3/4] w-full overflow-hidden rounded-3xl text-left shadow-soft',
        'transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      {city.imageUrl ? (
        <img
          src={city.imageUrl}
          alt={city.name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105',
            gradientFor(city.name + city.country)
          )}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="flex items-center gap-1 text-[11px] font-medium text-white/75">
          <MapPin className="size-3" aria-hidden />
          {city.country}
        </p>
        <h3 className="mt-0.5 font-display text-lg leading-tight font-semibold text-white">
          {city.name}
        </h3>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-brand-300"
              style={{ width: `${city.costIndex}%` }}
            />
          </div>
          <span className="text-[10px] font-medium whitespace-nowrap text-white/80">
            {costLabel(city.costIndex)}
          </span>
        </div>
      </div>
    </Tag>
  );
};

export const CityCardSkeleton = () => (
  <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-canvas-deep" />
);
