import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Lock } from 'lucide-react';

import { authApi } from '../../api/auth.api.js';
import { toApiError } from '../../api/client.js';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { Alert, Button, Input, PasswordInput } from '../../components/ui/index.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { ROUTES } from '../../lib/constants.js';
import { resetPasswordSchema } from '../../lib/validation.js';

const ResetPasswordPage = () => {
  usePageTitle('Choose a new password');
  const [params] = useSearchParams();
  const [requestError, setRequestError] = useState(null);
  const [complete, setComplete] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.get('token') || '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ token, password }) => {
    setRequestError(null);
    try {
      await authApi.resetPassword({ token, password });
      setComplete(true);
    } catch (error) {
      const parsed = toApiError(error);
      setRequestError(parsed.message);
      parsed.errors.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
    }
  };

  return (
    <AuthLayout
      eyebrow="Password reset"
      title={complete ? 'You are all set' : 'Choose a new password'}
      subtitle={
        complete
          ? 'Your password has been changed. Sign in and carry on planning.'
          : 'Reset tokens expire after 30 minutes and can only be used once.'
      }
      footer={
        <Link
          to={ROUTES.login}
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      {complete ? (
        <div className="space-y-6">
          <Alert tone="success" title="Password updated">
            Your new password is ready to use.
          </Alert>
          <Button to={ROUTES.login} size="lg" fullWidth rightIcon={<ArrowRight className="size-4" />}>
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {requestError && <Alert tone="error" title={requestError} />}

          <Input
            label="Reset token"
            icon={KeyRound}
            autoComplete="one-time-code"
            required
            hint="Copied from the reset email — it is filled in for you if you followed the link."
            error={errors.token?.message}
            {...register('token')}
          />

          <PasswordInput
            label="New password"
            placeholder="At least 8 characters"
            icon={Lock}
            autoComplete="new-password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordInput
            label="Confirm new password"
            placeholder="Repeat it"
            icon={Lock}
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
