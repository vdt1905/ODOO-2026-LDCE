import { z } from 'zod';

import { daysInclusive, toUtcDate } from './dates.js';
import { MAX_SEED_CITIES } from './constants.js';

/**
 * Mirrors backend/src/validators/auth.validator.js.
 * The client copy exists purely for instant feedback — the server is still the
 * authority and revalidates every field.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'That is too long')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(60, 'Too long'),
    lastName: z.string().trim().min(1, 'Last name is required').max(60, 'Too long'),
    email,
    phone: z.string().trim().max(20, 'Too long').optional().or(z.literal('')),
    city: z.string().trim().max(80, 'Too long').optional().or(z.literal('')),
    country: z.string().trim().max(80, 'Too long').optional().or(z.literal('')),
    bio: z.string().trim().max(500, 'Keep it under 500 characters').optional().or(z.literal('')),
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

/** Cheap strength meter for the signup form. */
export const passwordStrength = (value = '') => {
  const checks = [
    value.length >= 8,
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];
  const score = checks.filter(Boolean).length;

  if (!value) return { score: 0, label: '', tone: 'bg-line' };
  if (score <= 2) return { score, label: 'Weak', tone: 'bg-clay-500' };
  if (score === 3) return { score, label: 'Fair', tone: 'bg-cat-meals' };
  if (score === 4) return { score, label: 'Good', tone: 'bg-moss-500' };
  return { score, label: 'Strong', tone: 'bg-moss-600' };
};

/* -------------------------------------------------------------------------
   Create Trip — mirrors backend/src/validators/trip.validator.js.
   The API revalidates everything; this copy exists so the user sees the
   problem the moment they leave the field instead of after a round trip.
------------------------------------------------------------------------- */

/** A trip longer than this is almost certainly a typo in the year field. */
export const MAX_TRIP_DAYS = 365;

const dateField = z
  .string()
  .trim()
  .min(1, 'Pick a date')
  .refine((value) => toUtcDate(value) !== null, 'Pick a real calendar date');

export const createTripSchema = z
  .object({
    name: z.string().trim().min(1, 'Give your trip a name').max(120, 'Keep it under 120 characters'),
    description: z.string().trim().max(1000, 'Keep it under 1000 characters').optional().or(z.literal('')),
    startDate: dateField,
    endDate: dateField,
    // Left as a string: an empty number input yields '', and coercing that to 0
    // would silently set a zero budget the user never asked for.
    budgetLimit: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || (Number(value) >= 0 && Number.isFinite(Number(value))), 'Enter a positive number'),
    currency: z.string().trim().length(3),
    cityIds: z.array(z.string()).max(MAX_SEED_CITIES, `Pick up to ${MAX_SEED_CITIES} cities to start with`),
  })
  .superRefine((data, ctx) => {
    const start = toUtcDate(data.startDate);
    const end = toUtcDate(data.endDate);
    if (!start || !end) return;

    if (end < start) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The end date cannot be before the start date',
      });
      return;
    }

    if (daysInclusive(start, end) > MAX_TRIP_DAYS) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: `A trip can span at most ${MAX_TRIP_DAYS} days`,
      });
    }
  });
