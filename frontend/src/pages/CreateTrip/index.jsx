import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CalendarDays, Coins, MapPin, Moon, Wand2 } from 'lucide-react';

import { cityApi } from '../../api/city.api.js';
import { tripApi } from '../../api/trip.api.js';
import { userApi } from '../../api/user.api.js';
import { toApiError } from '../../api/client.js';
import { BANNERS, CURRENCIES, ROUTES } from '../../lib/constants.js';
import { createTripSchema } from '../../lib/validation.js';
import { daysInclusive, nightsBetween } from '../../lib/dates.js';
import { pluralise } from '../../lib/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Alert, Button, Input, Select, TextArea } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { CitySuggestions } from './CitySuggestions.jsx';
import { CoverPhotoPicker } from './CoverPhotoPicker.jsx';

/**
 * Create Trip — mockup screen 4.
 *
 * Name, dates and an optional cover up top; the city suggestion grid below.
 * Ticked cities travel with the POST as `cityIds` and the API turns them into
 * dated stops in the same request, so there is no window where a trip exists
 * without the stops the user asked for.
 */
const CreateTripPage = () => {
  usePageTitle('Plan a new trip');

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [selectedCities, setSelectedCities] = useState([]);
  const [citySearch, setCitySearch] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [coverError, setCoverError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [warning, setWarning] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      budgetLimit: '',
      currency: 'USD',
      cityIds: [],
    },
  });

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });

  /**
   * Arriving from a city card on the dashboard (`/trips/new?city=<id>`)
   * pre-ticks that city. A dud id is ignored rather than surfaced — the user
   * never typed it, so there is nothing for them to fix.
   */
  useEffect(() => {
    const cityId = params.get('city');
    if (!cityId) return undefined;

    let cancelled = false;
    cityApi
      .byId(cityId)
      .then((city) => {
        if (cancelled || !city) return;
        setSelectedCities((current) =>
          current.some((entry) => entry._id === city._id) ? current : [...current, city]
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [params]);

  // cityIds lives in the form purely so zod can enforce the cap alongside every
  // other field; the picker itself owns the full city objects.
  useEffect(() => {
    setValue(
      'cityIds',
      selectedCities.map((city) => city._id),
      { shouldValidate: false }
    );
  }, [selectedCities, setValue]);

  const toggleCity = (city) =>
    setSelectedCities((current) =>
      current.some((entry) => entry._id === city._id)
        ? current.filter((entry) => entry._id !== city._id)
        : [...current, city]
    );

  const nights = startDate && endDate ? nightsBetween(startDate, endDate) : 0;
  const days = startDate && endDate ? daysInclusive(startDate, endDate) : 0;
  const validRange = Boolean(startDate && endDate && !errors.startDate && !errors.endDate);

  const onSubmit = async (values) => {
    setFormError(null);
    setWarning(null);
    setSubmitting(true);

    // The cover goes to Cloudinary first so the trip is created with its final
    // URL already attached — one write, no half-saved state to reconcile.
    let coverPhotoUrl = '';
    let coverWarning = null;

    if (coverFile) {
      setUploading(true);
      try {
        const image = await userApi.uploadImage(coverFile, {
          kind: 'tripCover',
          onProgress: setProgress,
        });
        coverPhotoUrl = image.url;
      } catch (error) {
        // A cover photo is decoration — losing it must not cost the trip. But
        // it must not vanish silently either: this page unmounts on the
        // redirect below, so the reason travels with us and is shown on the
        // dashboard rather than flashing here for a few milliseconds.
        coverWarning = toApiError(error).message;
        setWarning(coverWarning);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }

    try {
      const trip = await tripApi.create({
        name: values.name,
        description: values.description || '',
        startDate: values.startDate,
        endDate: values.endDate,
        coverPhotoUrl,
        budgetLimit: values.budgetLimit === '' ? null : Number(values.budgetLimit),
        currency: values.currency,
        cityIds: selectedCities.map((city) => city._id),
      });

      // Straight to the dashboard, where the new trip is highlighted in the
      // list. The itinerary builder takes over from here once it exists.
      // Router state, not a query param: it carries the server's own wording
      // without dragging a paragraph of error text through the URL bar.
      navigate(`${ROUTES.landing}?created=${trip._id}&name=${encodeURIComponent(trip.name)}`, {
        replace: true,
        state: coverWarning ? { coverWarning } : null,
      });
    } catch (error) {
      const parsed = toApiError(error);
      setFormError(parsed.message);
      parsed.errors?.forEach((issue) => {
        if (issue.field) setError(issue.field, { type: 'server', message: issue.message });
      });
      setSubmitting(false);
    }
  };

  const busy = submitting || uploading;

  return (
    <>
      <PageHeader
        image={BANNERS.newTrip}
        breadcrumb={[{ label: 'My trips', to: ROUTES.trips }, { label: 'New trip' }]}
        kicker="Step 1 of 2 · the shape of the trip"
        title="Plan a new trip"
        sub="Give it a name and a window. Everything else — stops, activities, the budget — gets built on top of those two answers."
      />

      <div className="mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>

          <Link
            to={ROUTES.aiTrip}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <Wand2 className="size-3.5" aria-hidden />
            Or describe it and let AI plan it
          </Link>
        </div>

        <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        // scroll-mb keeps a focused field clear of the sticky action bar when
        // the browser scrolls it into view on a phone.
        className="mt-8 space-y-6 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32"
      >
        {formError && <Alert tone="error" title={formError} />}
        {warning && (
          <Alert tone="info" title="Heads up">
            {warning}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* Details */}
          <div className="space-y-5 rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6">
            <Input
              label="Trip name"
              placeholder="Europe Summer 2026"
              autoComplete="off"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <TextArea
              label="Description"
              placeholder="Three cities, slow mornings, and as much of the coast as we can fit."
              rows={3}
              hint="Optional — it shows on the shared itinerary page."
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* No `min` here on purpose: a past start date is legitimate —
                  the app has a Completed status and people log trips they have
                  already taken. The picker only blocks what is actually
                  invalid, which is an end date before the start. */}
              <Input
                label="Start date"
                type="date"
                required
                error={errors.startDate?.message}
                {...register('startDate')}
              />
              <Input
                label="End date"
                type="date"
                required
                // Never offer an end date before the start. The schema still
                // checks it; the picker just should not suggest a broken range.
                min={startDate || undefined}
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>

            {validRange && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-canvas-deep px-4 py-3 text-xs text-ink-700">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-ink-500" aria-hidden />
                  {pluralise(days, 'day')} on the ground
                </span>
                <span className="flex items-center gap-1.5">
                  <Moon className="size-3.5 text-ink-500" aria-hidden />
                  {pluralise(nights, 'night')}
                </span>
                {selectedCities.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-ink-500" aria-hidden />
                    split across {pluralise(selectedCities.length, 'city', 'cities')}
                  </span>
                )}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
              <Input
                label="Budget limit"
                type="number"
                inputMode="decimal"
                min="0"
                step="50"
                placeholder="4000"
                icon={Coins}
                hint="Optional — we flag the days that blow past it."
                error={errors.budgetLimit?.message}
                {...register('budgetLimit')}
              />
              <Select
                label="Currency"
                options={CURRENCIES}
                error={errors.currency?.message}
                {...register('currency')}
              />
            </div>
          </div>

          {/* Cover */}
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6">
            <CoverPhotoPicker
              file={coverFile}
              onChange={setCoverFile}
              onError={setCoverError}
              uploading={uploading}
              progress={progress}
            />
            {coverError && (
              <p role="alert" className="text-xs font-medium text-brand-600">
                {coverError}
              </p>
            )}
            <p className="text-xs leading-relaxed text-ink-500">
              A cover makes the trip easy to pick out on your dashboard and gives the shared page
              a header. Skip it and we draw a gradient from the trip name instead.
            </p>
          </div>
        </div>

        <CitySuggestions
          selected={selectedCities}
          onToggle={toggleCity}
          onClear={() => setSelectedCities([])}
          search={citySearch}
          onSearchChange={setCitySearch}
          error={errors.cityIds?.message}
        />

        {/* Sticky so the primary action is always one thumb away on mobile. */}
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-canvas/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-500">
              {selectedCities.length > 0
                ? `${pluralise(selectedCities.length, 'city', 'cities')} will be added as stops, split evenly across your dates.`
                : 'No cities yet — you can add every stop from the builder.'}
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.landing)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                loading={busy}
                rightIcon={<ArrowRight className="size-4" />}
              >
                {uploading ? 'Uploading cover' : 'Save trip'}
              </Button>
            </div>
          </div>
        </div>
        </form>
      </div>
    </>
  );
};

export default CreateTripPage;
