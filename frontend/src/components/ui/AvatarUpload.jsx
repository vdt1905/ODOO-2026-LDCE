import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * The circular "Photo" control from the signup mockup.
 *
 * Uploading to Cloudinary comes with the profile screen; for now it holds the
 * chosen file locally and previews it, and reports the file to the parent.
 */
export const AvatarUpload = ({ onChange, className, size = 'size-24' }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    onChange?.(file);
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative grid place-items-center overflow-hidden rounded-full',
          'border-2 border-dashed border-line bg-canvas-deep transition-colors',
          'hover:border-clay-400 hover:bg-clay-50',
          size
        )}
        aria-label="Upload a profile photo"
      >
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-ink-500">
            <Camera className="size-5" aria-hidden />
            <span className="text-[11px] font-medium">Photo</span>
          </span>
        )}
        <span className="absolute inset-0 hidden place-items-center bg-ink-900/45 text-[11px] font-medium text-white group-hover:grid">
          Change
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};
