import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, Coins, Wand2 } from 'lucide-react';

import { cityApi } from '../../api/city.api.js';
import { tripApi } from '../../api/trip.api.js';
import { toApiError } from '../../api/client.js';
import { BANNERS, CURRENCIES, ROUTES } from '../../lib/constants.js';
import { createTripSchema } from '../../lib/validation.js';
import { daysInclusive, nightsBetween } from '../../lib/dates.js';
import { pluralise } from '../../lib/format.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { Alert, Button, DateRangePicker, Input, Select, TextArea } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Section } from '../../components/layout/Section.jsx';
import { CitySuggestions } from './CitySuggestions.jsx';
import { CoverPhotoPicker } from './CoverPhotoPicker.jsx';
import { StepCard, StepRail } from './StepCard.jsx';
import { TripSummary } from './TripSummary.jsx';

/**
 * Create Trip — mockup screen 4.
 *
 * Name, dates and an optional cover up top; the city suggestion grid below.
 * Ticked cities travel with the POST as `cityIds` and the API turns them into
 * dated stops in the same request, so there is no window where a trip exists
 * without the stops the user asked for.
 *
 * The form is one page but reads as three numbered stages, with a live summary
 * beside them. Nothing here is a wizard: splitting a six-field form across
 * routes would cost more than it explains. The numbers are there so the user
 * can see what is left, not to gate anything.
 */

/** Plain-English names for the error summary that sits above the submit button. */
const FIELD_LABELS = {
  name: 'Trip name',
  description: 'Description',
  startDate: 'Start date',
  endDate: 'End date',
  budgetLimit: 'Budget limit',
  currency: 'Currency',
  cityIds: 'Cities',
};

const CreateTripPage = () => {
  usePageTitle('Plan a new trip');

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [selectedCities, setSelectedCities] = useState([]);
  const [citySearch, setCitySearch] = useState(params.get('destination') || '');

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
      startDate: params.get('start') || '',
      endDate: params.get('end') || '',
      budgetLimit: params.get('budget') || '',
      currency: 'USD',
      cityIds: [],
    },
  });

  const name = useWatch({ control, name: 'name' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const budgetLimit = useWatch({ control, name: 'budgetLimit' });
  const currency = useWatch({ control, name: 'currency' });

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

    let coverWarning = null;

    try {
      let trip = await tripApi.create({
        name: values.name,
        description: values.description || '',
        startDate: values.startDate,
        endDate: values.endDate,
        budgetLimit: values.budgetLimit === '' ? null : Number(values.budgetLimit),
        currency: values.currency,
        cityIds: selectedCities.map((city) => city._id),
      });

      // The dedicated cover route records Cloudinary's public id, allowing
      // later replacement and deletion to clean up the original asset.
      if (coverFile) {
        setUploading(true);
        try {
          const result = await tripApi.uploadCover(trip._id, coverFile, {
            onProgress: setProgress,
          });
          trip = result.trip;
        } catch (error) {
          // Cover failure is non-fatal: the trip already exists and remains usable.
          coverWarning = toApiError(error).message;
          setWarning(coverWarning);
        } finally {
          setUploading(false);
          setProgress(0);
        }
      }

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

  // Stage state drives the rail and the numbered markers. Step one is the only
  // one that can genuinely block a save, so it is the only one whose "done" is
  // anything other than a convenience.
  const basicsDone = Boolean(name?.trim() && validRange);
  const citiesDone = selectedCities.length > 0;

  const steps = [
    {
      title: 'The basics',
      hint: basicsDone ? 'Name and dates set' : 'Name, dates and budget',
      state: basicsDone ? 'done' : 'current',
    },
    {
      title: 'Where to',
      hint: citiesDone
        ? `${pluralise(selectedCities.length, 'city', 'cities')} picked`
        : 'Pick your cities — optional',
      state: citiesDone ? 'done' : basicsDone ? 'current' : 'todo',
    },
    {
      title: 'Review',
      hint: basicsDone ? 'Check it over and save' : 'Waiting on the basics',
      state: basicsDone ? 'current' : 'todo',
    },
  ];

  // Summarised at the button as well as shown against the field: a submit that
  // does nothing and says nothing is the worst outcome this form can have.
  const issues = Object.entries(errors)
    .map(([field, issue]) => ({ field, message: issue?.message }))
    .filter((issue) => typeof issue.message === 'string' && issue.message.length > 0);

  return (
    <>
      <PageHeader
        image={BANNERS.newTrip}
        breadcrumb={[{ label: 'My trips', to: ROUTES.trips }, { label: 'New trip' }]}
        kicker="Three steps · about two minutes"
        title="Plan a new trip"
        sub="Give it a name and a window. Everything else — stops, activities, the budget — gets built on top of those two answers."
      />

      <Section narrow tone="canvas">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>

          <Link
            to={ROUTES.aiTrip}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <Wand2 className="size-3.5" aria-hidden />
            Or describe it and let AI plan it
          </Link>
        </div>

        <StepRail steps={steps} className="mt-6" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          // scroll-mb keeps a focused field clear of the sticky action bar when
          // the browser scrolls it into view on a phone.
          className="mt-10 space-y-6 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32"
        >
          {formError && <Alert tone="error" title={formError} />}
          {warning && (
            <Alert tone="info" title="Heads up">
              {warning}
            </Alert>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19.5rem]">
            <div className="space-y-6">
              <StepCard
                id="step-basics"
                step={1}
                state={basicsDone ? 'done' : 'current'}
                title="The basics"
                sub="What the trip is called and when it runs. These two answers shape every date and budget the app works out for you."
              >
                <div className="space-y-5">
                  <Input
                    label="Trip name"
                    placeholder="Europe Summer 2026"
                    autoComplete="off"
                    required
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <TextArea
                    label="What is the trip about?"
                    placeholder="Three cities, slow mornings, and as much of the coast as we can fit."
                    rows={3}
                    hint="Optional — it shows on the shared itinerary page."
                    error={errors.description?.message}
                    {...register('description')}
                  />

                  {/* One range, one calendar. Two native date boxes made the
                      user think about start and end separately, which is how
                      you end up with an end date before the start — and they
                      render differently in every browser. `min` is left off on
                      purpose: a past start is legitimate, because the app has a
                      Completed status and people log trips they already took. */}
                  <DateRangePicker
                    label="Travel dates"
                    required
                    min={undefined}
                    startDate={startDate || ''}
                    endDate={endDate || ''}
                    error={errors.startDate?.message || errors.endDate?.message}
                    onChange={(range) => {
                      setValue('startDate', range.startDate, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue('endDate', range.endDate, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />

                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
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

                  <div className="border-t border-line-soft pt-5">
                    <CoverPhotoPicker
                      file={coverFile}
                      onChange={setCoverFile}
                      onError={setCoverError}
                      uploading={uploading}
                      progress={progress}
                    />
                    {coverError && (
                      <p
                        role="alert"
                        className="mt-2 flex items-start gap-1.5 text-xs font-medium text-ember-700"
                      >
                        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
                        <span>{coverError}</span>
                      </p>
                    )}
                  </div>
                </div>
              </StepCard>

              <StepCard
                id="step-cities"
                step={2}
                state={citiesDone ? 'done' : basicsDone ? 'current' : 'todo'}
                title="Where are you going?"
                sub="Tick the cities you already know you want. They become stops with dates and an opening budget the moment you save — you can reorder and edit every one later."
              >
                <CitySuggestions
                  selected={selectedCities}
                  onToggle={toggleCity}
                  onClear={() => setSelectedCities([])}
                  search={citySearch}
                  onSearchChange={setCitySearch}
                  error={errors.cityIds?.message}
                />
              </StepCard>
            </div>

            {/* Sticky on desktop so the running total stays in view while the
                fields above it change; it falls under the form on a phone,
                which is where a review step belongs anyway. */}
            <aside className="lg:sticky lg:top-24">
              <StepCard
                id="step-review"
                step={3}
                state={basicsDone ? 'current' : 'todo'}
                title="Review"
                sub="Updates as you type."
              >
                <TripSummary
                  name={name}
                  startDate={startDate}
                  endDate={endDate}
                  days={days}
                  nights={nights}
                  budgetLimit={budgetLimit}
                  currency={currency}
                  cities={selectedCities}
                  validRange={validRange}
                />
              </StepCard>
            </aside>
          </div>

          {/* Sticky so the primary action is always one thumb away on mobile. */}
          <div className="sticky bottom-0 -mx-4 border-t border-line bg-canvas/90 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
            {issues.length > 0 && (
              <div
                role="alert"
                className="mb-3 rounded-2xl border border-ember-100 bg-ember-50 px-4 py-3"
              >
                <p className="flex items-center gap-2 font-display text-[15px] leading-none text-ember-700 uppercase">
                  <AlertCircle className="size-4" aria-hidden />
                  {pluralise(issues.length, 'thing', 'things')} to fix before saving
                </p>
                <ul className="mt-2 space-y-1 text-xs text-ember-700">
                  {issues.map((issue) => (
                    <li key={issue.field}>
                      <span className="font-semibold">{FIELD_LABELS[issue.field] || issue.field}</span>{' '}
                      — {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-ink-500">
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
      </Section>
    </>
  );
};

export default CreateTripPage;
