import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, Save, Settings2, Trash2 } from 'lucide-react';
import { z } from 'zod';

import { toApiError } from '../../api/client.js';
import { tripApi } from '../../api/trip.api.js';
import { Alert, Button, DateRangePicker, Input, Select, TextArea } from '../../components/ui/index.js';
import { CURRENCIES } from '../../lib/constants.js';
import { toDateInputValue, toUtcDate } from '../../lib/dates.js';
import { env } from '../../lib/env.js';

const date = z.string().min(1, 'Pick a date').refine((value) => toUtcDate(value), 'Pick a real date');
const schema = z
  .object({
    name: z.string().trim().min(1, 'Trip name is required').max(120),
    description: z.string().trim().max(1000, 'Keep it under 1000 characters'),
    startDate: date,
    endDate: date,
    budgetLimit: z
      .string()
      .refine((value) => value === '' || (Number(value) >= 0 && Number(value) <= 10_000_000), 'Enter a valid budget'),
    currency: z.string().trim().length(3),
  })
  .refine((data) => toUtcDate(data.endDate) >= toUtcDate(data.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  });

const defaultsOf = (trip) => ({
  name: trip.name || '',
  description: trip.description || '',
  startDate: toDateInputValue(trip.startDate),
  endDate: toDateInputValue(trip.endDate),
  budgetLimit: trip.budgetLimit == null ? '' : String(trip.budgetLimit),
  currency: trip.currency || 'USD',
});

export const TripSettings = ({ trip, onChange }) => {
  const fileRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultsOf(trip) });

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });

  const save = async (values) => {
    setSaved(false);
    setFormError(null);
    const payload = Object.keys(dirtyFields).reduce((result, key) => {
      result[key] = key === 'budgetLimit' ? (values[key] === '' ? null : Number(values[key])) : values[key];
      return result;
    }, {});

    if (Object.keys(payload).length === 0) return;

    try {
      const updated = await tripApi.update(trip._id, payload);
      onChange(updated);
      reset(defaultsOf(updated));
      setSaved(true);
    } catch (caught) {
      const parsed = toApiError(caught);
      setFormError(parsed.message);
      parsed.errors.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!env.allowedImageTypes.includes(file.type)) {
      setImageError('Use a JPG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > env.maxUploadMb * 1024 * 1024) {
      setImageError(`Image must be under ${env.maxUploadMb}MB.`);
      return;
    }

    setUploading(true);
    setImageError(null);
    try {
      const result = await tripApi.uploadCover(trip._id, file);
      onChange(result.trip);
    } catch (caught) {
      setImageError(toApiError(caught).message);
    } finally {
      setUploading(false);
    }
  };

  const removeCover = async () => {
    setRemoving(true);
    setImageError(null);
    try {
      const result = await tripApi.removeCover(trip._id);
      onChange(result.trip);
    } catch (caught) {
      setImageError(toApiError(caught).message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <details className="group rounded-3xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Settings2 className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-lg text-ink-900">Trip details</span>
            <span className="block truncate text-xs text-ink-500">Dates, budget, currency, description, and cover</span>
          </span>
        </span>
        <span className="text-xs font-medium text-brand-600 group-open:hidden">Edit</span>
        <span className="hidden text-xs font-medium text-brand-600 group-open:inline">Close</span>
      </summary>

      <div className="border-t border-line p-5 sm:p-6">
        <form onSubmit={handleSubmit(save)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(15rem,0.8fr)]">
          <div className="space-y-4">
            {formError && <Alert tone="error" title={formError} />}
            {saved && <Alert tone="success" title="Trip details saved" />}
            <Input label="Trip name" required error={errors.name?.message} {...register('name')} />
            <TextArea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
            <DateRangePicker
              label="Travel dates"
              required
              min={undefined}
              startDate={startDate || ''}
              endDate={endDate || ''}
              error={errors.startDate?.message || errors.endDate?.message}
              onChange={(range) => {
                setValue('startDate', range.startDate, { shouldValidate: true, shouldDirty: true });
                setValue('endDate', range.endDate, { shouldValidate: true, shouldDirty: true });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
              <Input label="Budget limit" type="number" min="0" max="10000000" step="50" placeholder="No limit" error={errors.budgetLimit?.message} {...register('budgetLimit')} />
              <Select label="Currency" options={CURRENCIES} error={errors.currency?.message} {...register('currency')} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={isSubmitting} disabled={!isDirty} leftIcon={<Save className="size-4" />}>Save details</Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700">Cover photo</p>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-inset">
              {trip.coverPhotoUrl ? (
                <img src={trip.coverPhotoUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-ink-300"><ImagePlus className="size-8" aria-hidden /></div>
              )}
              {(uploading || removing) && (
                <div className="absolute inset-0 grid place-items-center bg-ink-900/50 text-white"><Loader2 className="size-6 animate-spin" aria-hidden /></div>
              )}
            </div>
            {imageError && <Alert tone="error">{imageError}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={uploading || removing} onClick={() => fileRef.current?.click()} leftIcon={<ImagePlus className="size-4" />}>
                {trip.coverPhotoUrl ? 'Replace cover' : 'Add cover'}
              </Button>
              {trip.coverPhotoUrl && (
                <Button type="button" variant="ghost" disabled={uploading || removing} onClick={removeCover} leftIcon={<Trash2 className="size-4" />}>Remove</Button>
              )}
            </div>
            <input ref={fileRef} type="file" accept={env.allowedImageTypes.join(',')} className="hidden" onChange={upload} />
          </div>
        </form>
      </div>
    </details>
  );
};
