import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Raw transport for the Gemini REST API.
 *
 * Node 20+ has global fetch, so we call the endpoint directly rather than
 * adding the SDK — one less dependency and one less shape to learn mid-build.
 */

const assertConfigured = () => {
  if (!env.gemini.isConfigured) {
    throw new ApiError(
      503,
      'AI trip planning is not configured on this server. Add GEMINI_API_KEY to backend/.env.'
    );
  }
};

const callOnce = async ({ systemPrompt, userPrompt, responseSchema, temperature }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.gemini.timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}/${env.gemini.model}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.gemini.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens: env.gemini.maxOutputTokens,
          // Thinking tokens come out of the same output budget; leaving it on
          // risks a MAX_TOKENS finish with no usable JSON inside our timeout.
          thinkingConfig: { thinkingBudget: env.gemini.thinkingBudget },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(
        `Gemini responded ${response.status}: ${detail.slice(0, 300) || response.statusText}`
      );
      error.status = response.status;
      // 5xx and 429 are worth one retry; 4xx (bad key, bad request) are not.
      error.retryable = response.status >= 500 || response.status === 429;
      throw error;
    }

    const payload = await response.json();
    const candidate = payload.candidates?.[0];

    if (!candidate) {
      const blocked = payload.promptFeedback?.blockReason;
      throw Object.assign(
        new Error(blocked ? `Request blocked: ${blocked}` : 'Gemini returned no candidates'),
        { retryable: !blocked }
      );
    }

    if (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
      throw Object.assign(new Error(`Generation stopped: ${candidate.finishReason}`), {
        retryable: false,
      });
    }

    const text = candidate.content?.parts?.map((part) => part.text).join('') || '';
    if (!text.trim()) {
      throw Object.assign(new Error('Gemini returned an empty response'), { retryable: true });
    }

    try {
      return JSON.parse(text);
    } catch {
      // Should be impossible with responseSchema set, but a truncated response
      // (MAX_TOKENS) can still produce invalid JSON.
      throw Object.assign(new Error('Gemini returned malformed JSON'), { retryable: true });
    }
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Calls Gemini with structured output. Retries once on a retryable failure,
 * then gives up — a second failure inside a 30s budget means something is
 * wrong that a third attempt will not fix.
 */
export const generateStructured = async ({
  systemPrompt,
  userPrompt,
  responseSchema,
  temperature = 0.85,
}) => {
  assertConfigured();

  try {
    return await callOnce({ systemPrompt, userPrompt, responseSchema, temperature });
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    if (!isTimeout && error.retryable === false) {
      throw new ApiError(502, `The trip planner failed: ${error.message}`);
    }

    console.warn(`[gemini] retrying after: ${error.message || error.name}`);

    try {
      // Lower temperature on the retry — a more conservative draft is likelier
      // to satisfy the schema.
      return await callOnce({
        systemPrompt,
        userPrompt,
        responseSchema,
        temperature: Math.max(0.2, temperature - 0.3),
      });
    } catch (retryError) {
      if (retryError.name === 'AbortError') {
        throw new ApiError(
          504,
          'The trip planner took too long to respond. Try a shorter trip or fewer days.'
        );
      }
      throw new ApiError(502, `The trip planner failed: ${retryError.message}`);
    }
  }
};
