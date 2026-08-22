import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Mail } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { Alert, Button, Input, PasswordInput } from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { loginSchema } from '../../lib/validation.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';

const LoginPage = () => {
  usePageTitle('Sign in');

  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((s) => s.login);
  const submitting = useAuthStore((s) => s.submitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Where the guard bounced them from, so we can return them after sign-in.
  const redirectTo = location.state?.from || ROUTES.landing;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => clearError, [clearError]);

  const onSubmit = async (values) => {
    const result = await login(values);
    if (result.ok) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Map any field-level errors the API returned onto the form.
    result.error?.errors?.forEach((issue) => {
      if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up your itineraries where you left off."
      footer={
        <>
          New here?{' '}
          <Link to={ROUTES.register} className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {error && error.errors?.length === 0 && (
          <Alert tone="error" title={error.message} />
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            icon={Lock}
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link
              to={ROUTES.forgotPassword}
              className="text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          rightIcon={<ArrowRight className="size-4" />}
        >
          Sign in
        </Button>
      </form>

      {/* Seeded accounts — remove before the app goes anywhere real. */}
      <div className="mt-6 rounded-2xl border border-dashed border-line bg-canvas-deep/60 p-4">
        <p className="text-xs font-medium text-ink-700">Demo accounts</p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-500">
          demo@globetrotter.com · Demo@1234
          <br />
          admin@globetrotter.com · Admin@123
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
