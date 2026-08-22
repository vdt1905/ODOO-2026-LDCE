import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { cn } from '../../lib/cn.js';
import { env } from '../../lib/env.js';

/**
 * 16:9 cover picker for the trip form.
 *
 * Like AvatarUpload it only validates and previews — the file is not sent
 * anywhere until the form is submitted, so abandoning the page leaves no
 * orphaned image sitting in Cloudinary.
 */
export const CoverPhotoPicker = ({ file, onChange, onError, uploading = false, progress = 0 }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Object URLs are a memory leak if they are never revoked.
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const replacePreview = (next) =>
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return next;
    });

  const handleFile = (event) => {
    const picked = event.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    event.target.value = '';
    if (!picked) return;

    if (!env.allowedImageTypes.includes(picked.type)) {
      onError?.('That file type is not supported — use JPG, PNG, WebP or GIF');
      return;
    }
    if (picked.size > env.maxUploadMb * 1024 * 1024) {
      onError?.(`Image must be under ${env.maxUploadMb}MB`);
      return;
    }

    replacePreview(URL.createObjectURL(picked));
    onError?.(null);
    onChange?.(picked);
  };

  const clear = () => {
    replacePreview(null);
    onError?.(null);
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">Cover photo</span>

      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'group relative grid aspect-[16/9] w-full place-items-center overflow-hidden rounded-2xl',
            'border-2 border-dashed border-line bg-canvas-deep transition-colors',
            'hover:border-clay-400 hover:bg-clay-50 disabled:cursor-wait'
          )}
          aria-label={preview ? 'Change the cover photo' : 'Upload a cover photo'}
        >
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1.5 px-4 text-center text-ink-500">
              <ImagePlus className="size-6" aria-hidden />
              <span className="text-sm font-medium">Add a cover photo</span>
              <span className="text-xs text-ink-300">
                Optional · JPG, PNG or WebP up to {env.maxUploadMb}MB
              </span>
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-ink-900/55 text-white">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              {progress > 0 && (
                <span className="absolute bottom-4 text-xs font-semibold">{progress}%</span>
              )}
            </span>
          )}
        </button>

        {preview && !uploading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove the cover photo"
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-ink-900/70 text-white backdrop-blur-sm transition-colors hover:bg-clay-600"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {file && !uploading && (
        <p className="truncate text-xs text-ink-500">{file.name}</p>
      )}

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
