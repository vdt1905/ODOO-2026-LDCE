import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const REGIONS = [
  'Europe',
  'Asia',
  'North America',
  'South America',
  'Africa',
  'Oceania',
];

const citySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    region: { type: String, enum: REGIONS, required: true },

    // 1–100. Drives the budget suggestions and the "cost meter" in city search.
    costIndex: { type: Number, min: 1, max: 100, default: 50 },
    // 1–100. Drives ordering of "Top Regional Selections" on the landing page.
    popularity: { type: Number, min: 1, max: 100, default: 50 },

    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, default: '' },
    currency: { type: String, default: 'USD' },

    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

citySchema.index({ name: 'text', country: 'text' });
citySchema.index({ country: 1 });
citySchema.index({ region: 1 });
citySchema.index({ popularity: -1 });
citySchema.index({ name: 1, country: 1 }, { unique: true });

export const City = model('City', citySchema);
