import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  },
  { _id: false, timestamps: { createdAt: 'invitedAt', updatedAt: false } }
);

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
    // A trip can be deliberately limited to one country. Stops enforce this
    // server-side, so a client cannot add an out-of-country city by bypassing
    // the country picker in the UI.
    destinationCountry: { type: String, trim: true, maxlength: 100, default: '' },

    isPublic: { type: Boolean, default: false },
    publicSlug: { type: String, unique: true, sparse: true, index: true },

    // Provenance when this trip came from someone else's "Copy Trip".
    copiedFrom: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
    viewCount: { type: Number, default: 0 },

    // The owner always retains publishing and deletion control. Editors can
    // work on the itinerary; viewers can open the itinerary, budget and map.
    members: { type: [memberSchema], default: [] },
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
tripSchema.index({ 'members.user': 1, startDate: -1 });

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
