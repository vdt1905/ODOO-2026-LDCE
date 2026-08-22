import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/** One city leg of a trip. A trip is an ordered list of stops. */
const stopSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true },

    order: { type: Number, required: true, default: 0 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    notes: { type: String, trim: true, default: '' },

    transportCost: { type: Number, min: 0, default: 0 },
    accommodationCost: { type: Number, min: 0, default: 0 },
    mealBudgetPerDay: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

stopSchema.index({ trip: 1, order: 1 });

stopSchema.virtual('activities', {
  ref: 'TripActivity',
  localField: '_id',
  foreignField: 'stop',
  options: { sort: { date: 1, order: 1 } },
});

export const Stop = model('Stop', stopSchema);
