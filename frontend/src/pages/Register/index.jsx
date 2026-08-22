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
      title="Create your account"
      subtitle="A few details now, and every trip you plan stays in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to={ROUTES.login} className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {error && error.errors?.length === 0 && <Alert tone="error" title={error.message} />}

        <div className="flex flex-col items-center gap-2">
          <AvatarUpload
            onChange={setAvatarFile}
            onError={setAvatarError}
            uploading={uploading}
            progress={progress}
          />
          <p className="text-xs text-ink-500">
            {uploading
              ? 'Uploading your photo…'
              : avatarFile
                ? avatarFile.name
                : 'Add a profile photo (optional)'}
          </p>
          {avatarError && (
            <p role="alert" className="max-w-sm text-center text-xs font-medium text-brand-600">
              {avatarError}
            </p>
          )}
        </div>

        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        {/* Contact */}
        <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Credentials */}
        <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="mt-2 flex items-center gap-2">
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
                <span className="text-[11px] font-medium text-ink-500">{strength.label}</span>
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
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
