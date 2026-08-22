import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail } from 'lucide-react';

import { authApi } from '../../api/auth.api.js';
import { toApiError } from '../../api/client.js';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { Alert, Button, Input } from '../../components/ui/index.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { ROUTES } from '../../lib/constants.js';
import { forgotPasswordSchema } from '../../lib/validation.js';

const ForgotPasswordPage = () => {
  usePageTitle('Reset your password');
  const [result, setResult] = useState(null);
  const [requestError, setRequestError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setRequestError(null);
    setResult(null);
    try {
      const response = await authApi.forgotPassword(values);
      setResult({ message: response.message, token: response.data?.resetToken || '' });
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
      eyebrow="Password help"
      title="Reset your password"
      subtitle="Enter the email on your account and we will start a secure reset. The link expires in 30 minutes."
      footer={
        <Link
          to={ROUTES.login}
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {requestError && <Alert tone="error" title={requestError} />}
        {result && (
          <Alert tone="success" title="Check your email">
            {result.message}
          </Alert>
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          required
          hint="Use the address you signed up with."
          error={errors.email?.message}
          {...register('email')}
        />

        {result?.token ? (
          <Button
            to={`${ROUTES.resetPassword}?token=${encodeURIComponent(result.token)}`}
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="size-4" />}
          >
            Continue with development token
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Send reset link
          </Button>
        )}
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
