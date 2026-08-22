import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Globe2, Lock, Mail, MapPin, Phone, User } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import {
  Alert,
  AvatarUpload,
  Button,
  Input,
  PasswordInput,
  TextArea,
} from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { passwordStrength, registerSchema } from '../../lib/validation.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';

/**
 * One numbered block of the signup form.
 *
 * The form has ten controls; without these the two-column grid reads as a wall
 * of boxes. A numbered rule turns it into three short, obviously-finishable
 * steps on one page.
 */
const Group = ({ step, title, hint, children }) => (
  <section className="space-y-5">
    <div className="flex items-start gap-3 border-b border-line-soft pb-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 font-sans text-[11px] font-semibold text-brand-600">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-[15px] leading-tight text-ink-900 uppercase">{title}</h2>
        {hint && <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

const RegisterPage = () => {
  usePageTitle('Create your account');

  const navigate = useNavigate();

  const registerUser = useAuthStore((s) => s.register);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const submitting = useAuthStore((s) => s.submitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // The photo is uploaded after the account exists, because the upload
  // endpoint needs the access token that registration issues.
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      bio: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => clearError, [clearError]);

  // useWatch (not watch) so the subscription stays memo-safe under the compiler.
  const passwordValue = useWatch({ control, name: 'password' });
  const strength = passwordStrength(passwordValue);

  const onSubmit = async (values) => {
    // confirmPassword is a client-side check only — the API never sees it.
    const { firstName, lastName, email, phone, city, country, bio, password } = values;
    const result = await registerUser({
      firstName,
      lastName,
      email,
      phone,
      city,
      country,
      bio,
      password,
    });
    if (!result.ok) {
      result.error?.errors?.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
      return;
    }

    // A failed photo upload must not cost them the account they just created —
    // it is reported inline and can be retried from the profile screen.
    if (avatarFile) {
      setUploading(true);
      const upload = await uploadAvatar(avatarFile, { onProgress: setProgress });
      setUploading(false);

      if (!upload.ok) {
        setAvatarError(`${upload.error.message} You can add a photo later from your profile.`);
        window.setTimeout(() => navigate(ROUTES.landing, { replace: true }), 2500);
        return;
      }
    }

    navigate(ROUTES.landing, { replace: true });
  };

  return (
    <AuthLayout
      wide
      eyebrow="New account"
      title="Create your account"
      subtitle="A few details now, and every trip you plan stays in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={ROUTES.login}
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-9">
        {error && error.errors?.length === 0 && <Alert tone="error" title={error.message} />}

        {/* Photo — optional, so it sits above the numbered steps rather than
            inside one, where it would read as something you have to do. */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-line-soft bg-inset p-5 sm:flex-row sm:items-center sm:gap-5">
          <AvatarUpload
            onChange={setAvatarFile}
            onError={setAvatarError}
            uploading={uploading}
            progress={progress}
          />
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-display text-[15px] leading-tight text-ink-900 uppercase">
              Profile photo
            </p>
            <p className="mt-1 truncate text-xs text-ink-500">
              {uploading
                ? 'Uploading your photo…'
                : avatarFile
                  ? avatarFile.name
                  : 'Optional — you can add one later from your profile.'}
            </p>
            {avatarError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-ember-700">
                {avatarError}
              </p>
            )}
          </div>
        </div>

        <Group step="1" title="About you" hint="This is the name we put on your itineraries.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="First name"
              placeholder="Vansh"
              autoComplete="given-name"
              icon={User}
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Tandel"
              autoComplete="family-name"
              icon={User}
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              icon={Mail}
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone number"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              icon={Phone}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
        </Group>

        <Group
          step="2"
          title="Where you travel from"
          hint="Optional. It helps us put the right cities in front of you."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="City"
              placeholder="Ahmedabad"
              autoComplete="address-level2"
              icon={MapPin}
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="Country"
              placeholder="India"
              autoComplete="country-name"
              icon={Globe2}
              error={errors.country?.message}
              {...register('country')}
            />
          </div>

          <TextArea
            label="Additional information"
            placeholder="Tell us how you like to travel — slow and local, or six cities in ten days?"
            rows={3}
            error={errors.bio?.message}
            {...register('bio')}
          />
        </Group>

        <Group step="3" title="Set a password" hint="At least 8 characters. Longer is stronger.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                icon={Lock}
                required
                error={errors.password?.message}
                {...register('password')}
              />

              {strength.label && !errors.password && (
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex h-1 flex-1 gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.tone : 'bg-line'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-ink-500">{strength.label}</span>
                </div>
              )}
            </div>

            <PasswordInput
              label="Confirm password"
              placeholder="Repeat it"
              autoComplete="new-password"
              icon={Lock}
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
        </Group>

        <div className="space-y-3 border-t border-line-soft pt-7">
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting || uploading}
            rightIcon={<ArrowRight className="size-4" />}
          >
            {uploading ? 'Uploading photo' : 'Create account'}
          </Button>

          <p className="text-center text-xs text-ink-500">
            By continuing you agree to keep your travel plans slightly over budget.
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
