import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { env } from '../../lib/env.js';

const isTooBig = (file) => file.size > env.maxUploadMb * 1024 * 1024;

/**
 * The circular "Photo" control from the signup mockup.
 *
 * Purely presentational: it validates and previews the file, then hands it to
 * the parent, which decides when to send it to Cloudinary.
 *
 * `value` shows an already-uploaded image (profile screen); `uploading` and
 * `progress` render the in-flight state.
 */
export const AvatarUpload = ({
  value,
  onChange,
  onError,
  uploading = false,
  progress = 0,
  className,
  size = 'size-24',
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change.
    event.target.value = '';
    if (!file) return;

    if (!env.allowedImageTypes.includes(file.type)) {
      onError?.('That file type is not supported — use JPG, PNG, WebP or GIF');
      return;
    }
    if (isTooBig(file)) {
      onError?.(`Image must be under ${env.maxUploadMb}MB`);
      return;
    }

    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    onError?.(null);
    onChange?.(file);
  };

  const shown = preview || value;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'group relative grid place-items-center overflow-hidden rounded-full',
          'border-2 border-dashed border-line bg-canvas-deep transition-colors',
          'hover:border-clay-400 hover:bg-clay-50 disabled:cursor-wait',
          size
        )}
        aria-label={shown ? 'Change your profile photo' : 'Upload a profile photo'}
      >
        {shown ? (
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-ink-500">
            <Camera className="size-5" aria-hidden />
            <span className="text-[11px] font-medium">Photo</span>
          </span>
        )}

        {uploading ? (
          <span className="absolute inset-0 grid place-items-center bg-ink-900/55 text-white">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {progress > 0 && (
              <span className="absolute bottom-3 text-[10px] font-semibold">{progress}%</span>
            )}
          </span>
        ) : (
          <span className="absolute inset-0 hidden place-items-center bg-ink-900/45 text-[11px] font-medium text-white group-hover:grid">
            Change
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={env.allowedImageTypes.join(',')}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};
