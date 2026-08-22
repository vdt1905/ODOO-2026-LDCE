import mongoose from 'mongoose';
import { z } from 'zod';

import { daysInclusive, parseDateOnly } from '../utils/dates.js';

/** A trip longer than this is almost certainly a typo in the year field. */
export const MAX_TRIP_DAYS = 365;
/** How many cities the Create Trip screen may pre-seed as stops in one call. */
export const MAX_SEED_CITIES = 12;

const objectId = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), 'That is not a valid id');

/**
 * Calendar date off the wire. `<input type="date">` sends 'YYYY-MM-DD';
 * a re-submitted trip may send a full ISO string. Both land as UTC midnight.
 */
const dateOnly = z
  .string({ required_error: 'This date is required' })
  .trim()
  .min(1, 'This date is required')
  .refine((value) => parseDateOnly(value) !== null, 'Pick a real calendar date')
  .transform((value) => parseDateOnly(value));

/**
 * '' from an untouched number input means "no limit", not zero.
 *
 * On create the field defaults to null; on update it stays genuinely optional,
 * so a PATCH that omits it leaves the existing budget alone instead of wiping it.
 */
const money = ({ defaultToNull }) => {
  const base = z
    .preprocess(
      (value) => (value === '' || value === null || value === undefined ? null : value),
      z
        .coerce
        .number({ invalid_type_error: 'Enter a number' })
        .min(0, 'A budget cannot be negative')
        .max(10_000_000, 'That budget is unrealistically large')
        .nullable()
    )
    .optional();

  return defaultToNull ? base.default(null) : base;
};

/** Shared by create and update — the window has to make sense either way. */
const assertSaneWindow = (data, ctx) => {
  const { startDate, endDate } = data;
  if (!startDate || !endDate) return;

  if (endDate < startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'The end date cannot be before the start date',
    });
    return;
  }

  if (daysInclusive(startDate, endDate) > MAX_TRIP_DAYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: `A trip can span at most ${MAX_TRIP_DAYS} days`,
    });
  }
};

export const createTripSchema = z
  .object({
    name: z
      .string({ required_error: 'Give your trip a name' })
      .trim()
      .min(1, 'Give your trip a name')
      .max(120, 'Keep the name under 120 characters'),
    description: z.string().trim().max(1000, 'Keep it under 1000 characters').optional().default(''),
    startDate: dateOnly,
    endDate: dateOnly,
    coverPhotoUrl: z.string().trim().max(600).optional().default(''),
    budgetLimit: money({ defaultToNull: true }),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Use a three-letter currency code')
      .optional()
      .default('USD'),
    /** Cities ticked on the Create Trip screen; become stops immediately. */
    cityIds: z
      .array(objectId)
      .max(MAX_SEED_CITIES, `Pick up to ${MAX_SEED_CITIES} cities to start with`)
      .optional()
      .default([]),
  })
  .strict()
  .superRefine(assertSaneWindow);

export const updateTripSchema = z
  .object({
    name: z.string().trim().min(1, 'Give your trip a name').max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    coverPhotoUrl: z.string().trim().max(600).optional(),
    budgetLimit: money({ defaultToNull: false }),
    currency: z.string().trim().toUpperCase().length(3).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nothing to update' });
    }
    assertSaneWindow(data, ctx);
  });

export const TRIP_STATUSES = ['all', 'ongoing', 'upcoming', 'completed'];
export const TRIP_VISIBILITIES = ['all', 'public', 'private'];
export const TRIP_SORTS = ['soonest', 'latest', 'recent', 'name'];

/**
 * Query string for GET /trips — coerced here so the controller trusts it.
 *
 * Every field `.catch()`es back to its default: a stale bookmark with
 * `?sort=cheapest` should quietly show the default list, not 422 at someone
 * who only wanted to see their trips.
 */
export const listTripsQuerySchema = z
  .object({
    status: z.enum(TRIP_STATUSES).optional().default('all').catch('all'),
    visibility: z.enum(TRIP_VISIBILITIES).optional().default('all').catch('all'),
    search: z.string().trim().max(120).optional().default('').catch(''),
    sort: z.enum(TRIP_SORTS).optional().default('soonest').catch('soonest'),
    page: z.coerce.number().int().min(1).optional().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(12).catch(12),
  })
  .passthrough();
