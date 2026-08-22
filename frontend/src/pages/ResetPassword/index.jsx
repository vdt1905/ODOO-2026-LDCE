import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authApi } from '../../api/auth.api.js';
import { toApiError } from '../../api/client.js';
import { Alert, Button, PasswordInput } from '../../components/ui/index.js';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';

const ResetPasswordPage = () => {
  usePageTitle('Choose a new password');
  const { token } = useParams(); const navigate = useNavigate();
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [status, setStatus] = useState({ loading: false, error: null });
  const submit = async (event) => { event.preventDefault(); if (password !== confirm) { setStatus({ loading: false, error: { message: 'Passwords do not match' } }); return; } setStatus({ loading: true, error: null }); try { await authApi.resetPassword({ token, password }); navigate('/login', { replace: true }); } catch (error) { setStatus({ loading: false, error: toApiError(error) }); } };
  return <AuthLayout title="Choose a new password" subtitle="Make it memorable enough for you, hard enough for everyone else." footer={<Link to="/login" className="font-medium text-clay-600 hover:underline">Back to sign in</Link>}><form className="space-y-5" onSubmit={submit}>{status.error && <Alert tone="error" title={status.error.message} />}<PasswordInput label="New password" icon={Lock} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password"/><PasswordInput label="Confirm new password" icon={Lock} value={confirm} onChange={(event) => setConfirm(event.target.value)} required autoComplete="new-password"/><Button fullWidth type="submit" size="lg" loading={status.loading}>Update password</Button></form></AuthLayout>;
};
export default ResetPasswordPage;
