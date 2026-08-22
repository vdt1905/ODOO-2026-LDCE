import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';

import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { Alert, Button, Input, PasswordInput } from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { loginSchema } from '../../lib/validation.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAuthStore } from '../../store/authStore.js';

/** Seeded accounts — remove before the app goes anywhere real. */
const DEMO_ACCOUNTS = [
  { role: 'Traveller', email: 'demo@globetrotter.com', password: 'Demo@1234' },
  { role: 'Admin', email: 'admin@globetrotter.com', password: 'Admin@123' },
];

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
    setValue,
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

  const fillDemo = (account) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Pick up your itineraries exactly where you left off."
      footer={
        <>
          New here?{' '}
          <Link
            to={ROUTES.register}
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && error.errors?.length === 0 && <Alert tone="error" title={error.message} />}

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
          <div className="mt-2.5 text-right">
            <Link
              to={ROUTES.forgotPassword}
              className="text-xs font-semibold text-ink-500 underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
            >
              Forgot your password?
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

      {/* Demo accounts — a deliberate "try it" affordance, not leftover debug
          output. It used to be a card with a heading, a paragraph and two
          three-line rows, which cost about 200px and pushed the sign-in button
          below the fold. Two chips say the same thing. */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
          <Sparkles className="size-3.5 text-brand-500" aria-hidden />
          Try a demo account
        </span>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => fillDemo(account)}
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-inset px-2.5 text-[11.5px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {account.role}
            <ArrowRight className="size-3" aria-hidden />
          </button>
        ))}
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
