import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Globe, Mail, MapPin, Phone, User as UserIcon } from 'lucide-react';

import { userApi } from '../../api/user.api.js';
import { toApiError } from '../../api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { Alert, Button, Input, Select, TextArea } from '../../components/ui/index.js';
import { BIO_MAX, languageOptions, profileSchema } from './profileSchema.js';

/** The form always holds a string, never null — a nullish field would go out as `null` and 422. */
const toDefaults = (user) => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  phone: user.phone ?? '',
  city: user.city ?? '',
  country: user.country ?? '',
  bio: user.bio ?? '',
  languagePref: user.languagePref ?? 'en',
});

export const ProfileForm = ({ user }) => {
  const setUser = useAuthStore((s) => s.setUser);

  const [formError, setFormError] = useState(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: toDefaults(user),
  });

  const bio = useWatch({ control, name: 'bio' }) ?? '';

  const onSubmit = async (values) => {
    setFormError(null);
    setSaved(false);

    // The endpoint takes a partial and rejects an empty body, so only the
    // fields the user touched travel. dirtyFields flags a *touched* field, but
    // retyping the same value is not news for the server — hence the second
    // comparison against what is already on the account.
    const payload = Object.keys(dirtyFields).reduce((changed, field) => {
      const next = values[field];
      if (next !== (user[field] ?? '')) changed[field] = next;
      return changed;
    }, {});

    if (Object.keys(payload).length === 0) {
      reset(values);
      setSaved(true);
      return;
    }

    try {
      const updated = await userApi.updateProfile(payload);
      // The navbar reads its name and avatar straight off the store, so this is
      // what makes the header update without a reload.
      setUser(updated);
      reset(toDefaults(updated));
      setSaved(true);
    } catch (error) {
      const parsed = toApiError(error);
      setFormError(parsed.message);
      parsed.errors?.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      // Clearing the banner on the first edit after a save stops a stale
      // "Saved" sitting above fields that no longer match what was sent.
      onChange={() => saved && setSaved(false)}
      className="space-y-6 rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 className="font-display text-xl text-ink-900">Your details</h2>
        <p className="mt-1 text-sm text-ink-500">
          This is what shows on trips you share and on your public itineraries.
        </p>
      </div>

      {formError && <Alert tone="error" title="That did not save">{formError}</Alert>}
      {saved && (
        <Alert tone="success" title="Profile saved">
          Your details are up to date everywhere in the app.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          icon={UserIcon}
          autoComplete="given-name"
          maxLength={60}
          required
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last name"
          autoComplete="family-name"
          maxLength={60}
          required
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      {/* Read-only text, not a disabled input: an input the user cannot type
          into still reads as "editable, just not right now". Changing an email
          is an auth flow, not a profile field. */}
      <div className="rounded-2xl border border-line bg-inset px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <Mail className="size-3.5" aria-hidden />
          Email
        </p>
        <p className="mt-1 truncate text-sm font-medium text-ink-900">{user.email}</p>
        <p className="mt-1 text-xs text-ink-500">
          Your sign-in address cannot be changed from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          type="tel"
          icon={Phone}
          autoComplete="tel"
          maxLength={20}
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Select
          label="Language"
          icon={Globe}
          options={languageOptions(user.languagePref)}
          hint="Used for dates and copy as more of the app is translated."
          error={errors.languagePref?.message}
          {...register('languagePref')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          icon={MapPin}
          autoComplete="address-level2"
          maxLength={80}
          placeholder="Ahmedabad"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Country"
          autoComplete="country-name"
          maxLength={80}
          placeholder="India"
          error={errors.country?.message}
          {...register('country')}
        />
      </div>

      <div>
        <TextArea
          label="Bio"
          rows={4}
          maxLength={BIO_MAX}
          placeholder="Slow mornings, long train rides, and every food market I can find."
          error={errors.bio?.message}
          {...register('bio')}
        />
        <p className="mt-1.5 text-right text-xs text-ink-500">
          {bio.length} / {BIO_MAX}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset(toDefaults(user));
            setFormError(null);
            setSaved(false);
          }}
          disabled={!isDirty || isSubmitting}
        >
          Discard changes
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isDirty}
          leftIcon={<Check className="size-4" />}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
};
