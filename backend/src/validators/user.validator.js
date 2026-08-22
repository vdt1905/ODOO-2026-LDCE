import { z } from 'zod';

/** Only the fields a user may edit about themselves from the profile screen. */
export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(60).optional(),
    lastName: z.string().trim().min(1, 'Last name is required').max(60).optional(),
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
