import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { env } from '../../lib/env.js';
import { useAuthStore } from '../../store/authStore.js';
import { Alert, AvatarUpload, Button } from '../../components/ui/index.js';

/**
 * Profile photo. The store's uploadAvatar/removeAvatar already write the
 * returned user back into state, so the navbar avatar changes the moment
 * either call resolves — nothing here needs to re-fetch.
 */
export const PhotoCard = ({ user }) => {
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const removeAvatar = useAuthStore((s) => s.removeAvatar);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // AvatarUpload keeps its own object-URL preview of the picked file. Remounting
  // it after a failure throws that away, so a photo that never reached
  // Cloudinary cannot sit there looking saved.
  const [pickerKey, setPickerKey] = useState(0);

  const handleFile = async (file) => {
    setError(null);
    setNotice(null);
    setUploading(true);
    setProgress(0);

    const result = await uploadAvatar(file, { onProgress: setProgress });

    setUploading(false);
    setProgress(0);

    if (!result.ok) {
      // Surfaced verbatim: a 503 here says Cloudinary is not configured on the
      // server, which is the one message that tells a developer what to fix.
      setError(result.error.message);
      setPickerKey((key) => key + 1);
      return;
    }

    setNotice('Profile photo updated.');
  };

  const handleRemove = async () => {
    setError(null);
    setNotice(null);
    setRemoving(true);

    const result = await removeAvatar();

    setRemoving(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setPickerKey((key) => key + 1);
    setNotice('Profile photo removed.');
  };

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl text-ink-900">Photo</h2>
        <p className="mt-1 text-sm text-ink-500">
          Shown on the navbar and beside any itinerary you share.
        </p>
      </div>

      <AvatarUpload
        key={pickerKey}
        value={user.avatarUrl}
        onChange={handleFile}
        onError={setError}
        uploading={uploading}
        progress={progress}
        size="size-28"
      />

      <p className="text-center text-xs leading-relaxed text-ink-500">
        JPG, PNG, WebP, AVIF or GIF, up to {env.maxUploadMb}MB. It uploads as soon as you pick it.
      </p>

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <Button
        variant="outline"
        fullWidth
        loading={removing}
        // The endpoint 400s when there is nothing to delete, so the control is
        // off rather than offering an action that can only fail.
        disabled={!user.avatarUrl}
        onClick={handleRemove}
        leftIcon={<Trash2 className="size-4" />}
      >
        Remove photo
      </Button>
    </section>
  );
};
