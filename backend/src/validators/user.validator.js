import { z } from 'zod';
import { strongPassword } from './auth.validator.js';

/** Only the fields a user may edit about themselves from the profile screen. */
export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(60).optional(),
    lastName: z.string().trim().min(1, 'Last name is required').max(60).optional(),
    // PDF feature 12 lists email as editable. Uniqueness is checked in the
    // controller, which returns a 409 rather than a Mongo duplicate-key error.
    email: z.string().trim().toLowerCase().email('Enter a valid email address').optional(),
    phone: z.string().trim().max(20).optional(),
    city: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
    languagePref: z.string().trim().max(10).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nothing to update',
  });

/** Changing a password while signed in — distinct from the reset-by-token flow. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: strongPassword,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'Choose a password different from your current one',
  });

/**
 * Deleting an account is irreversible and takes every trip with it, so it is
 * gated on the current password rather than a confirmation checkbox alone.
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm'),
});
