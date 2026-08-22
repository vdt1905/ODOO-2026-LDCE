import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';

import { aiApi } from '../../api/ai.api.js';
import { toApiError } from '../../api/client.js';
import {
  AI_EXAMPLE_PROMPTS,
  AI_MAX_DAYS,
  AI_PACES,
  BANNERS,
  CURRENCIES,
  ROUTES,
} from '../../lib/constants.js';
import { todayInputValue } from '../../lib/dates.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useAsync } from '../../hooks/useAsync.js';
import { Alert, Button, Input, Select, TextArea } from '../../components/ui/index.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { GeneratingState } from './GeneratingState.jsx';

// Both mirror generateTripSchema on the server, so the counter under the box
// turns red at the same length the API would reject.
const MIN_PROMPT = 10;
const MAX_PROMPT = 1000;

/**
 * Describe a trip in a sentence; Gemini writes the stops and the day plan.
 *
 * The endpoint does not hand back an itinerary to approve — it writes a real,
 * fully editable trip and returns its id. So success here is a redirect into the
 * builder rather than a preview: whatever the model produced is already yours,
 * and there is nothing to "accept".
 */
const AiTripPage = () => {
  usePageTitle('Plan with AI');

  const navigate = useNavigate();

  // The Gemini key is optional on the server, so the feature can genuinely be
  // missing at runtime — gate the form rather than letting the button 503.
  const { data: status, loading: statusLoading } = useAsync(() => aiApi.status(), []);

  const [form, setForm] = useState({
    prompt: '',
    startDate: todayInputValue(),
    days: 7,
    travelers: 2,
    budgetLimit: 2000,
    currency: 'USD',
    pace: 'balanced',
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Flipped on unmount so a resolved request cannot navigate after the user has
  // left. The call legitimately runs for up to ~60s, which is a long time to
  // stay on one screen.
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const maxDays = status?.maxDays ?? AI_MAX_DAYS;
  const promptLength = form.prompt.trim().length;
  const promptValid = promptLength >= MIN_PROMPT && promptLength <= MAX_PROMPT;
  const unavailable = !statusLoading && status ? !status.available : false;

  const submit = async (event) => {
    event.preventDefault();
    if (!promptValid || generating) return;

    setGenerating(true);
    setError(null);
    setFieldErrors({});

    try {
      // Every numeric field goes over as a number: the server's schema is
      // z.number(), and an <input type="number"> hands back a string.
      const result = await aiApi.generateTrip({
        prompt: form.prompt.trim(),
        startDate: form.startDate,
        days: Number(form.days),
        travelers: Number(form.travelers),
        budgetLimit: Number(form.budgetLimit),
        currency: form.currency,
        pace: form.pace,
      });

      if (!alive.current) return;
      // Straight into the builder — the trip exists, it just needs looking at.
      navigate(ROUTES.tripBuilder(result.tripId), { state: { generated: result } });
    } catch (caught) {
      if (!alive.current) return;

      const parsed = toApiError(caught);
      setError(parsed.message);
      setFieldErrors(
        Object.fromEntries(
          parsed.errors.filter((issue) => issue.field).map((issue) => [issue.field, issue.message])
        )
      );
      setGenerating(false);
    }
  };

  if (generating) return <GeneratingState days={Number(form.days)} />;

  return (
    <>
      <PageHeader
        image={BANNERS.aiTrip}
        breadcrumb={[{ label: 'My trips', to: ROUTES.trips }, { label: 'Plan with AI' }]}
        kicker="Describe it, don't build it"
        title="Plan with AI"
        sub="One sentence about the trip you want. You get back a real itinerary — dated stops, day-by-day activities, costs — that you can edit like any other."
      />

      <div className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:px-6">
        {unavailable && (
          <Alert tone="info" title="The planner is switched off on this server" className="mb-6">
            No model key is configured, so generation would fail. Add either{' '}
            <code className="rounded bg-canvas-deep px-1.5 py-0.5 text-xs">GROQ_API_KEY</code> or{' '}
            <code className="rounded bg-canvas-deep px-1.5 py-0.5 text-xs">GEMINI_API_KEY</code> to{' '}
            <code className="rounded bg-canvas-deep px-1.5 py-0.5 text-xs">backend/.env</code> and
            restart the API — the same Groq key the assistant uses works here. In the meantime you
            can{' '}
            <Link to={ROUTES.newTrip} className="font-semibold underline">
              build a trip by hand
            </Link>
            .
          </Alert>
        )}

        {error && (
          <Alert tone="error" title={error} className="mb-6">
            Nothing was saved — your brief is still below, so you can adjust it and try again.
          </Alert>
        )}

        <form onSubmit={submit} noValidate className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <TextArea
              label="What kind of trip?"
              value={form.prompt}
              onChange={(event) => set({ prompt: event.target.value })}
              rows={4}
              maxLength={MAX_PROMPT}
              required
              placeholder="Ten relaxed days in Japan for two, focused on food and temples."
              hint={
                promptLength < MIN_PROMPT
                  ? `${MIN_PROMPT - promptLength} more characters — the more specific, the better the plan.`
                  : `${promptLength}/${MAX_PROMPT} characters.`
              }
              error={fieldErrors.prompt}
            />

            <div>
              <p className="eyebrow text-ink-500">Or start from one of these</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {AI_EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => set({ prompt: example })}
                    className="rounded-full border border-line bg-canvas-deep px-3.5 py-2 text-left text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 rounded-3xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
            <Input
              label="Leaving on"
              type="date"
              required
              value={form.startDate}
              min={todayInputValue()}
              onChange={(event) => set({ startDate: event.target.value })}
              error={fieldErrors.startDate}
            />

            <Input
              label="How many days"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={maxDays}
              value={form.days}
              onChange={(event) => set({ days: event.target.value })}
              hint={`1–${maxDays}. Longer briefs time out before the model finishes.`}
              error={fieldErrors.days}
            />

            <Input
              label="Travellers"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={form.travelers}
              onChange={(event) => set({ travelers: event.target.value })}
              error={fieldErrors.travelers}
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
              <Input
                label="Budget"
                type="number"
                inputMode="decimal"
                min={0}
                step={100}
                value={form.budgetLimit}
                onChange={(event) => set({ budgetLimit: event.target.value })}
                error={fieldErrors.budgetLimit}
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(event) => set({ currency: event.target.value })}
                // Just the code here — the full label does not fit beside the
                // amount, and the amount is what gives it context anyway.
                options={CURRENCIES.map((currency) => ({
                  value: currency.value,
                  label: currency.value,
                }))}
                error={fieldErrors.currency}
              />
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2.5 text-sm font-medium text-ink-700">Pace</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {AI_PACES.map((pace) => {
                  const selected = form.pace === pace.value;
                  return (
                    <button
                      key={pace.value}
                      type="button"
                      onClick={() => set({ pace: pace.value })}
                      aria-pressed={selected}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-line bg-canvas-deep hover:border-line-strong'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-ink-900">{pace.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                        {pace.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-500">
              Usually 10–30 seconds. Five generations per 15 minutes.
            </p>
            <div className="flex gap-3">
              <Button to={ROUTES.newTrip} variant="outline">
                Build by hand
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!promptValid || unavailable}
                leftIcon={<Wand2 className="size-4" />}
                rightIcon={<ArrowRight className="size-4" />}
              >
                Generate itinerary
              </Button>
            </div>
          </div>
        </form>

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          The planner invents plausible plans, not verified ones. Check opening hours and prices
          before you book anything.
        </p>
      </div>
    </>
  );
};

export default AiTripPage;
