import { z } from 'zod';
import { dateInput } from './trip.validator.js';

const cost = (label) =>
  z.number({ invalid_type_error: `${label} must be a number` }).min(0, `${label} cannot be negative`);

export const createStopSchema = z
  .object({
    cityId: z.string({ required_error: 'Pick a city' }).min(1, 'Pick a city'),
    startDate: dateInput('Arrival date'),
    endDate: dateInput('Departure date'),
    notes: z.string().trim().max(1000).optional().default(''),
    transportCost: cost('Transport cost').optional().default(0),
    accommodationCost: cost('Accommodation cost').optional().default(0),
    mealBudgetPerDay: cost('Meal budget').optional().default(0),
    // Omitted → appended to the end of the trip.
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'Departure must be on or after arrival',
  });

export const updateStopSchema = z
  .object({
    cityId: z.string().min(1).optional(),
    startDate: dateInput('Arrival date').optional(),
    endDate: dateInput('Departure date').optional(),
    notes: z.string().trim().max(1000).optional(),
    transportCost: cost('Transport cost').optional(),
    accommodationCost: cost('Accommodation cost').optional(),
    mealBudgetPerDay: cost('Meal budget').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' })
  .refine(
    (data) => !(data.startDate && data.endDate) || data.endDate >= data.startDate,
    { path: ['endDate'], message: 'Departure must be on or after arrival' }
  );

export const reorderSchema = z.object({
  orderedIds: z
    .array(z.string().min(1))
    .min(1, 'Send the ids in their new order'),
});
