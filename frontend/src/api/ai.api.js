import { api } from './client.js';

/**
 * Gemini-backed trip generation.
 *
 * The key is optional on the server, so the feature can be absent at runtime —
 * always gate the entry point on `status()` rather than letting a button 503.
 * Note `status()` itself requires auth, so it cannot be called before sign-in.
 */
export const aiApi = {
  /**
   * { available, provider, model, maxDays }. `provider` is 'gemini' | 'groq'
   * | null, and `model` is null when unavailable.
   */
  status: () => api.get('/ai/status').then((r) => r.data.data),

  /**
   * → { tripId, stopCount, activityCount, generatedInMs }
   *
   * The trip itself is NOT returned — it is written to the database as a real,
   * editable trip and you navigate to `tripId` to load it.
   *
   * The server retries a timed-out generation once at 30s, so this call can
   * legitimately run for ~60s; the timeout below leaves headroom over that
   * rather than aborting a request the server is still working on.
   *
   * Rate limited to 5 per 15 minutes per user.
   */
  generateTrip: (payload) =>
    api.post('/ai/generate-trip', payload, { timeout: 75000 }).then((r) => r.data.data),
};
