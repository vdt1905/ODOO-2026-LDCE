import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const ACTIVITY_TYPES = [
  'sightseeing',
  'food',
  'adventure',
  'culture',
  'nightlife',
  'relaxation',
  'shopping',
];

/** Catalog of things to do. Belongs to a City; attached to a trip via TripActivity. */
const activitySchema = new Schema(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },

    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: '' },

    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    cost: { type: Number, min: 0, default: 0 },
    durationMinutes: { type: Number, min: 0, default: 60 },
    rating: { type: Number, min: 0, max: 5, default: 4 },
  },
  { timestamps: true }
);

activitySchema.index({ name: 'text', description: 'text' });
activitySchema.index({ city: 1, type: 1 });
activitySchema.index({ cost: 1 });

export const Activity = model('Activity', activitySchema);
