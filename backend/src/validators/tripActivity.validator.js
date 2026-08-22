import { z } from 'zod';
import { dateInput } from './trip.validator.js';

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 09:30');

// zod validates .default() values, so an unset time must be an accepted value,
// not just a fallback — hence the explicit empty-string branch.
const optionalTime = z.union([timeOfDay, z.literal('')]);

export const createTripActivitySchema = z
  .object({
    stopId: z.string({ required_error: 'Which stop is this for?' }).min(1, 'Which stop is this for?'),
    // Either a catalog activity...
    activityId: z.string().min(1).optional(),
    // ...or a free-text one the user invented.
    customName: z.string().trim().max(160).optional(),
    date: dateInput('Date'),
    startTime: optionalTime.optional().default(''),
    // No defaults here on purpose: left undefined, the controller falls back to
    // the catalog entry's own cost and duration.
    durationMinutes: z.number().int().min(0).max(1440, 'That is longer than a day').optional(),
    cost: z.number().min(0, 'Cost cannot be negative').optional(),
    notes: z.string().trim().max(500).optional().default(''),
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => Boolean(data.activityId || data.customName?.trim()), {
    path: ['activityId'],
    message: 'Pick an activity from the catalog or give a custom name',
  });

export const updateTripActivitySchema = z
  .object({
    stopId: z.string().min(1).optional(),
    activityId: z.string().min(1).nullable().optional(),
    customName: z.string().trim().max(160).optional(),
    date: dateInput('Date').optional(),
    startTime: optionalTime.optional(),
    durationMinutes: z.number().int().min(0).max(1440).optional(),
    cost: z.number().min(0).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });
