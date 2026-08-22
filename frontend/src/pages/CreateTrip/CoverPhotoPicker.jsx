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
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold tracking-[0.09em] text-ink-700 uppercase">
        Cover photo
      </span>

      <div className="relative max-w-md">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'group relative grid aspect-[16/9] w-full cursor-pointer place-items-center overflow-hidden rounded-2xl',
            'border border-dashed border-line-dashed bg-inset',
            'transition-colors duration-200',
            'hover:border-brand-400 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-70'
          )}
          aria-label={preview ? 'Change the cover photo' : 'Upload a cover photo'}
        >
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 px-4 text-center">
              <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-brand-500 transition-colors group-hover:border-brand-300">
                <ImagePlus className="size-5" aria-hidden />
              </span>
              <span className="font-display text-sm leading-none text-ink-900 uppercase">
                Add a cover photo
              </span>
              <span className="text-xs text-ink-500">
                Optional · JPG, PNG or WebP up to {env.maxUploadMb}MB
              </span>
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-ink-900/60 text-white">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              {progress > 0 && (
                <span className="absolute bottom-4 font-display text-lg leading-none">
                  {progress}%
                </span>
              )}
            </span>
          )}
        </button>

        {preview && !uploading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove the cover photo"
            className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full bg-ink-900/70 text-white backdrop-blur-sm transition-colors hover:bg-ember-500"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {file && !uploading ? (
        <p className="max-w-md truncate text-xs text-ink-500">{file.name}</p>
      ) : (
        <p className="max-w-md text-xs leading-relaxed text-ink-500">
          It makes the trip easy to pick out on your dashboard and gives the shared page a header.
          Skip it and we draw a gradient from the trip name instead.
        </p>
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
