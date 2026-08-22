import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * The associative entity between a Stop and a catalog Activity.
 * It carries its own attributes (date, time, cost snapshot, notes, order),
 * which is exactly why it is its own collection and not an array on Stop.
 *
 * `activity` is nullable so a user can add a fully custom activity that
 * does not exist in the catalog — `customName` is used in that case.
 */
const tripActivitySchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    stop: { type: Schema.Types.ObjectId, ref: 'Stop', required: true, index: true },
    activity: { type: Schema.Types.ObjectId, ref: 'Activity', default: null },

    customName: { type: String, trim: true, default: '' },

    date: { type: Date, required: true },
    startTime: { type: String, default: '' }, // 'HH:mm'
    durationMinutes: { type: Number, min: 0, default: 60 },

    // Snapshot of the price at the time it was added; the catalog may drift.
    cost: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tripActivitySchema.index({ trip: 1, date: 1, order: 1 });

export const TripActivity = model('TripActivity', tripActivitySchema);
