import { env } from '../lib/env.js';

/**
 * Client for the LangGraph suggestions service (AI/, FastAPI on :8000).
 *
 * This does NOT go through `api/client.js`. That module unwraps the Express
 * API's `{ success, message, data }` envelope and attaches the access token —
 * neither applies here. The Python service returns its Pydantic models raw and
 * has no auth of its own, so a shared client would have to special-case it on
 * every call. One small dedicated module is cheaper.
 *
 * Every failure mode here is "the service is not running", which is the normal
 * state on a fresh checkout. So `health()` never throws — it answers false —
 * and the widget uses that to show an explanation instead of an error.
 */

const TIMEOUT_MS = 45_000;

/** fetch + AbortController, so a hung graph run cannot leave the UI spinning. */
const call = async (path, { method = 'GET', body, signal } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Caller-supplied cancellation (the user closing the panel) has to compose
  // with the timeout, and AbortSignal.any is not in every browser we target.
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(`${env.aiServiceUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        detail?.slice(0, 300) || `The AI service answered ${response.status}.`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
};

/** True when the FastAPI process is up. Never throws. */
export const aiHealth = async () => {
  try {
    const data = await call('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
};

/**
 * Run the graph. Resolves to
 * `{ summary, reply, intent, suggestions, languageCode, scriptCode }`.
 *
 * `intent` is the branch the graph took: `'chat'` for a conversational turn,
 * where `reply` is the whole answer and `suggestions` is empty, or `'plan'` for
 * a catalog-grounded one, where `summary` introduces the suggestions.
 *
 * `tripId` is optional and is what makes an answer specific rather than
 * generic — the graph loads that trip's stops and budget before it reasons, so
 * asking "am I over budget in Kyoto?" from inside a trip gets a real answer.
 */
export const aiSuggest = ({ prompt, userId, tripId, signal }) =>
  call('/suggestions', {
    method: 'POST',
    signal,
    body: { prompt, user_id: userId || null, trip_id: tripId || null },
  });
