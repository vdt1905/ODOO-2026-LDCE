import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, Trash2 } from 'lucide-react';

import { toApiError } from '../../api/client.js';
import { userApi } from '../../api/user.api.js';
import { Alert, Button, ConfirmDialog, PasswordInput } from '../../components/ui/index.js';
import { ROUTES } from '../../lib/constants.js';
import { changePasswordSchema } from '../../lib/validation.js';
import { useAuthStore } from '../../store/authStore.js';

export const AccountSecurity = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePassword = async ({ currentPassword, newPassword }) => {
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      const result = await userApi.changePassword({ currentPassword, newPassword });
      setPasswordMessage(result.message || 'Password updated');
      reset();
    } catch (error) {
      const parsed = toApiError(error);
      setPasswordError(parsed.message);
      parsed.errors.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await userApi.deleteAccount(deletePassword);
      clearSession();
      navigate(ROUTES.landing, { replace: true });
    } catch (error) {
      setDeleteError(toApiError(error).message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="account-security">
      <h2 id="account-security" className="font-display text-xl text-ink-900">Account security</h2>
      <p className="mt-1 text-sm text-ink-500">Update your credentials or close the account.</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-start">
        <form onSubmit={handleSubmit(changePassword)} noValidate className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg text-ink-900">
              <KeyRound className="size-4 text-brand-500" aria-hidden />
              Change password
            </h3>
            <p className="mt-1 text-sm text-ink-500">Use at least eight characters with a letter and number.</p>
          </div>

          {passwordError && <Alert tone="error" title={passwordError} />}
          {passwordMessage && <Alert tone="success" title={passwordMessage} />}

          <PasswordInput label="Current password" icon={Lock} autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
          <PasswordInput label="New password" icon={Lock} autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
          <PasswordInput label="Confirm new password" icon={Lock} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

          <Button type="submit" loading={isSubmitting}>Update password</Button>
        </form>

        <div className="space-y-4 rounded-3xl border border-ember-300 bg-surface p-5 sm:p-6">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg text-ink-900">
              <Trash2 className="size-4 text-ember-700" aria-hidden />
              Delete account
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">This permanently removes your trips, activities, shared links, and uploaded images.</p>
          </div>

          {deleteError && <Alert tone="error" title={deleteError} />}
          <PasswordInput
            label="Current password"
            icon={Lock}
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
          <Button variant="outline" disabled={!deletePassword || deleting} onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="size-4" />}>
            Delete my account
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account permanently?"
        description="Every trip, scheduled activity, uploaded image, and public link will be removed. This cannot be undone."
        confirmLabel="Delete account"
        loading={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
};
