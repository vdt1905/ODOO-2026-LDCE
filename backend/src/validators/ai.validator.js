import { z } from 'zod';
import { dateInput } from './trip.validator.js';

export const generateTripSchema = z.object({
  prompt: z
    .string({ required_error: 'Tell us about the trip you want' })
    .trim()
    .min(10, 'Give the planner a little more to work with')
    .max(1000, 'Keep the brief under 1000 characters'),

  startDate: dateInput('Start date'),

  // 21 days is the practical ceiling inside a 30s generation budget.
  days: z
    .number({ required_error: 'How many days?' })
    .int('Days must be a whole number')
    .min(1, 'A trip needs at least one day')
    .max(21, 'Try 21 days or fewer — longer trips time out'),

  travelers: z.number().int().min(1).max(20).optional().default(1),
  budgetLimit: z.number().min(0).max(1_000_000).optional().default(2000),
  currency: z.string().trim().length(3).toUpperCase().optional().default('USD'),
  pace: z.enum(['relaxed', 'balanced', 'packed']).optional().default('balanced'),
});
