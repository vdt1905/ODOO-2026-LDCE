import { MapPin } from 'lucide-react';

import { ACTIVITY_TYPE_META } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

/**
 * The glyph for an activity type.
 *
 * These used to be emoji (🏛 🍽 🥾 …), which was a mistake for three reasons:
 * every OS draws them differently so a filter row looked like seven unrelated
 * stickers, they are full-colour in a palette that is otherwise two colours and
 * a grey, and they do not scale — an emoji has no stroke weight to match the
 * lucide icons sitting next to it in the same row.
 *
 * A single `MapPin` fallback covers the `custom` rows the itinerary service
 * stamps on free-text entries, and anything a future server enum adds before
 * the client knows about it.
 */
export const ActivityIcon = ({ type, className }) => {
  const Icon = ACTIVITY_TYPE_META[type]?.Icon || MapPin;
  return <Icon className={cn('size-4 shrink-0', className)} aria-hidden />;
};
