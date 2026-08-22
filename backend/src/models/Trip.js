import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const tripSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    coverPhotoUrl: { type: String, default: '' },
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
    toJSON: { virtuals: true },
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

/** 'upcoming' | 'ongoing' | 'completed', derived from today — never stored. */
tripSchema.virtual('status').get(function () {
  const today = new Date();
  if (this.endDate && this.endDate < today) return 'completed';
  if (this.startDate && this.startDate > today) return 'upcoming';
  return 'ongoing';
});

export const Trip = model('Trip', tripSchema);
