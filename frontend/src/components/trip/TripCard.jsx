import { CalendarDays, MapPin, MoreHorizontal, Pencil, Trash2, UsersRound } from 'lucide-react';
import { Badge, Button } from '../ui/index.js';
import { dateRange, money, plural } from '../../lib/format.js';
import { gradientFor } from '../../lib/constants.js';

const STATUS_TONE = { ongoing: 'moss', upcoming: 'clay', completed: 'neutral' };

export const TripCard = ({ trip, onDelete, compact = false }) => {
  const id = trip._id;
  const cities = trip.cities?.filter(Boolean) || [];
  return (
    <article className="group overflow-hidden rounded-4xl border border-line bg-surface shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-lift">
      <div className={`relative flex h-28 items-end overflow-hidden bg-gradient-to-br p-4 ${gradientFor(trip.name)}`} style={trip.coverPhotoUrl ? { backgroundImage: `linear-gradient(rgba(23,20,15,.08), rgba(23,20,15,.58)), url(${trip.coverPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <Badge tone={STATUS_TONE[trip.status] || 'neutral'}>{trip.status || 'draft'}</Badge>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold text-ink-900">{trip.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-ink-500"><CalendarDays className="size-3.5" />{dateRange(trip.startDate, trip.endDate)}</p></div><span className="rounded-full bg-canvas-deep p-2 text-ink-500"><MoreHorizontal className="size-4" /></span></div>
        {!compact && <><p className="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-ink-500">{trip.description || 'Your itinerary is ready for its next detail.'}</p><div className="mt-4 flex items-center gap-2 text-xs text-ink-500"><MapPin className="size-3.5 text-clay-500" />{cities.length ? cities.slice(0, 3).join(' · ') : 'No stops added yet'}</div><div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-500"><span>{plural(trip.stopCount || 0, 'city')} · {plural(trip.activityCount || 0, 'activity')}</span><strong className="text-ink-900">{money(trip.estimatedCost || 0, trip.currency)}</strong></div></>}
        <div className="mt-5 flex gap-2"><Button to={`/trips/${id}`} variant="dark" size="sm" className="flex-1">View</Button><Button to={`/trips/${id}/members`} variant="outline" size="sm" aria-label={`Collaborators for ${trip.name}`}><UsersRound className="size-3.5" /></Button><Button to={`/trips/${id}/build`} variant="outline" size="sm" aria-label={`Edit ${trip.name}`}><Pencil className="size-3.5" /></Button>{onDelete && <Button variant="ghost" size="sm" onClick={() => onDelete(trip)} aria-label={`Delete ${trip.name}`}><Trash2 className="size-3.5 text-clay-600" /></Button>}</div>
      </div>
    </article>
  );
};
