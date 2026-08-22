import { z } from 'zod';

/**
 * zod v3 on the backend (the frontend runs v4) — keep `z.string().datetime()`
 * style here and do not copy-paste schemas across the two halves.
 */

/** Accepts 'YYYY-MM-DD' or a full ISO string, always yields a Date. */
export const dateInput = (label) =>
  z
    .union([z.string(), z.date()], { required_error: `${label} is required` })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: `${label} must be a valid date`,
    })
    .transform((value) => new Date(value));

const optionalDateInput = (label) => dateInput(label).optional();

const money = (label) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(10_000_000, `${label} is unrealistically large`);

export const createTripSchema = z
  .object({
    name: z.string().trim().min(1, 'Trip name is required').max(120, 'Trip name is too long'),
    description: z.string().trim().max(1000, 'Keep the description under 1000 characters').optional().default(''),
    startDate: dateInput('Start date'),
    endDate: dateInput('End date'),
    coverPhotoUrl: z.string().trim().optional().default(''),
    budgetLimit: money('Budget limit').nullable().optional(),
    currency: z.string().trim().length(3, 'Use a 3-letter currency code').toUpperCase().optional().default('USD'),
    destinationCountry: z.string().trim().min(1, 'Choose a country').max(100).optional(),
    // Cities the user pre-selected on the create screen — turned into stops.
    cityIds: z.array(z.string()).max(20, 'That is a lot of cities for one trip').optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  });

export const updateTripSchema = z
  .object({
    name: z.string().trim().min(1, 'Trip name is required').max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    startDate: optionalDateInput('Start date'),
    endDate: optionalDateInput('End date'),
    coverPhotoUrl: z.string().trim().optional(),
    budgetLimit: money('Budget limit').nullable().optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
    destinationCountry: z.string().trim().min(1, 'Choose a country').max(100).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' })
  .refine(
    (data) => !(data.startDate && data.endDate) || data.endDate >= data.startDate,
    { path: ['endDate'], message: 'End date must be on or after the start date' }
  );

export const listTripsQuerySchema = z.object({
  status: z.enum(['ongoing', 'upcoming', 'completed']).optional(),
  search: z.string().trim().max(120).optional().default(''),
  sort: z.enum(['recent', 'oldest', 'name', 'start-asc', 'start-desc']).optional().default('start-desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});
