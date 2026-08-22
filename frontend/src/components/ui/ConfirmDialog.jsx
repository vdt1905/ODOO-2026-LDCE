import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from './Button.jsx';

/**
 * Small confirmation modal for destructive actions.
 *
 * Built on <dialog> so the browser handles the top layer, the backdrop, the
 * Escape key and the focus trap — all of which a div-with-fixed-inset would
 * have to reimplement, usually badly.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape and the backdrop both fire 'cancel'/'close'; route them to onCancel
  // so the parent's state cannot drift out of sync with the dialog's.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;

    const handleCancel = (event) => {
      event.preventDefault();
      if (!loading) onCancel?.();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [loading, onCancel]);

  return (
    <dialog
      ref={ref}
      // The dialog element is centred by the UA; these only style the box.
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-0 text-ink-900 shadow-lift backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
      onClick={(event) => {
        // A click on the dialog itself (not its content) is a backdrop click.
        if (event.target === ref.current && !loading) onCancel?.();
      }}
    >
      <div className="p-6">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
