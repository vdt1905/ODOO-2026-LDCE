import { z } from 'zod';

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
