import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { toApiError } from '../../api/client.js';
import { Alert, Button, Input } from '../../components/ui/index.js';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const ForgotPasswordPage = () => {
  usePageTitle('Reset your password');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, message: '', token: '' });
  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null, message: '', token: '' });
    try {
      const response = await authApi.forgotPassword({ email });
      setStatus({ loading: false, error: null, message: response.message, token: response.data?.resetToken || '' });
    } catch (error) { setStatus({ loading: false, error: toApiError(error), message: '', token: '' }); }
  };
  return <AuthLayout title="Reset your password" subtitle="Enter your email and we’ll help you get back to planning." footer={<Link to="/login" className="font-medium text-clay-600 hover:underline">Back to sign in</Link>}><form className="space-y-5" onSubmit={submit}>{status.error && <Alert tone="error" title={status.error.message} />}{status.message && <Alert tone="success" title={status.message} />}{status.token && <div className="rounded-2xl border border-moss-100 bg-moss-50 p-3 text-xs text-moss-800">Development reset token: <code className="break-all font-semibold">{status.token}</code></div>}<Input label="Email address" type="email" icon={Mail} value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com"/><Button fullWidth type="submit" size="lg" loading={status.loading}>Send reset link</Button></form></AuthLayout>;
};
export default ForgotPasswordPage;
