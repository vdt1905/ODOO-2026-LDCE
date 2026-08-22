import mongoose from 'mongoose';
import { startOfUTCDay } from '../utils/dates.js';

const { Schema, model } = mongoose;

const tripSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    coverPhotoUrl: { type: String, default: '' },
    // Cloudinary public_id — kept so a replaced cover is not orphaned.
    coverPublicId: { type: String, default: '', select: false },
    budgetLimit: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'USD' },

    isPublic: { type: Boolean, default: false },
    publicSlug: { type: String, unique: true, sparse: true, index: true },

    // Provenance when this trip came from someone else's "Copy Trip".
    copiedFrom: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.coverPublicId;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

tripSchema.index({ user: 1, startDate: -1 });

tripSchema.virtual('stops', {
  ref: 'Stop',
  localField: '_id',
  foreignField: 'trip',
  options: { sort: { order: 1 } },
});

/**
 * 'upcoming' | 'ongoing' | 'completed', derived from today — never stored.
 *
 * Compared at UTC day boundaries, not by instant: a trip whose last day is
 * today is still *ongoing*, and it must not flip to completed just because the
 * server clock has passed midnight-UTC-of-that-day.
 *
 * trip.controller.js filters by the same boundaries, so the list a user asks
 * for and the badge on the card can never disagree.
 */
tripSchema.virtual('status').get(function () {
  if (!this.startDate || !this.endDate) return 'upcoming';

  const today = startOfUTCDay(new Date());
  if (startOfUTCDay(this.endDate) < today) return 'completed';
  if (startOfUTCDay(this.startDate) > today) return 'upcoming';
  return 'ongoing';
});

export const Trip = model('Trip', tripSchema);
