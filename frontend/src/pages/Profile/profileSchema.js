import { z } from 'zod';

/**
 * Mirrors backend/src/validators/user.validator.js.
 *
 * It lives here rather than in lib/validation.js because the server schema is
 * `.strict()` — these eight keys are the *entire* accepted surface of
 * PATCH /users/me, and anything else (password, role, avatarUrl) is a
 * 422 rather than a silent ignore. Keeping the copy beside its only caller
 * makes that pairing obvious.
 *
 * Every field is required here even though the endpoint takes a partial: the
 * form always holds all eight, and onSubmit narrows the payload down to the
 * fields that actually changed.
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'Keep it under 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Keep it under 60 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().trim().max(20, 'Keep it under 20 characters'),
  city: z.string().trim().max(80, 'Keep it under 80 characters'),
  country: z.string().trim().max(80, 'Keep it under 80 characters'),
  bio: z.string().trim().max(500, 'Keep it under 500 characters'),
  languagePref: z.string().trim().max(10, 'Keep it under 10 characters'),
});

/** Matches User.bio's maxlength — drives the live counter under the field. */
export const BIO_MAX = 500;

/**
 * `languagePref` is an unconstrained string on the server, so a select is the
 * only thing stopping a free-text field from filling up with codes nothing
 * renders. Values are ISO 639-1, which also keeps them inside the 10-char cap.
 */
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ja', label: '日本語' },
];

/**
 * An account created before this list existed can hold a code that is not in
 * it; dropping it would silently rewrite the user's setting the first time
 * they saved anything else, so it is offered back to them verbatim.
 */
export const languageOptions = (current) =>
  !current || LANGUAGES.some((language) => language.value === current)
    ? LANGUAGES
    : [...LANGUAGES, { value: current, label: current }];
