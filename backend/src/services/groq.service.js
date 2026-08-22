import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Raw transport for Groq, exposing exactly the same `generateStructured`
 * contract as `gemini.service.js` so `llm.service.js` can pick either one
 * without the planner knowing which answered.
 *
 * Two differences from Gemini are worth knowing about:
 *
 *   · **JSON mode is not schema-enforced.** Groq guarantees the response
 *     parses, not that it matches a shape. So the schema is written into the
 *     prompt as a JSON Schema document and the model is told to obey it. The
 *     Zod pass in `ai.service.js` is the real gate either way — it always was,
 *     because a schema constrains shape and not sanity.
 *
 *   · **The schema needs translating.** `TRIP_RESPONSE_SCHEMA` is Gemini's
 *     uppercase OpenAPI dialect (`type: 'OBJECT'`). `toJsonSchema` lowercases
 *     it into the standard dialect rather than us maintaining two copies that
 *     would silently drift apart.
 */

const TYPES = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
  INTEGER: 'integer',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
};

/** Gemini's uppercase OpenAPI dialect -> standard JSON Schema. */
export const toJsonSchema = (node) => {
  if (!node || typeof node !== 'object') return node;

  const out = { ...node };
  if (typeof node.type === 'string') out.type = TYPES[node.type] || node.type.toLowerCase();
  if (node.items) out.items = toJsonSchema(node.items);
  if (node.properties) {
    out.properties = Object.fromEntries(
      Object.entries(node.properties).map(([key, value]) => [key, toJsonSchema(value)])
    );
  }
  return out;
};

const callOnce = async ({ systemPrompt, userPrompt, responseSchema, temperature }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.groq.timeoutMs);

  // The schema rides in the system message. Groq's json_object mode only
  // promises valid JSON, so this is what makes it the *right* JSON.
  const system = responseSchema
    ? `${systemPrompt}\n\nOUTPUT\nReply with a single JSON object and nothing else — no prose, no markdown fence. It must validate against this JSON Schema exactly; include every required key, and use no keys that are not listed:\n${JSON.stringify(
        toJsonSchema(responseSchema)
      )}`
    : systemPrompt;

  try {
    const response = await fetch(`${env.groq.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.groq.apiKey}`,
      },
      body: JSON.stringify({
        model: env.groq.model,
        temperature,
        max_tokens: env.groq.maxOutputTokens,
        // Only the gpt-oss family takes this, and sending it to a model that
        // does not is a 400 — so it is opt-in by model id, not unconditional.
        ...(/gpt-oss/.test(env.groq.model) && env.groq.reasoningEffort
          ? { reasoning_effort: env.groq.reasoningEffort }
          : {}),
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const error = new Error(
        `Groq responded ${response.status}: ${detail.slice(0, 300) || response.statusText}`
      );
      error.status = response.status;
      // 5xx and 429 are worth one retry; 4xx (bad key, bad request) are not —
      // except json_validate_failed, which is the model truncating or drifting
      // and is exactly the case a cooler retry fixes.
      error.retryable =
        response.status >= 500 ||
        response.status === 429 ||
        detail.includes('json_validate_failed');
      throw error;
    }

    const payload = await response.json();
    const choice = payload.choices?.[0];

    if (!choice) {
      throw Object.assign(new Error('Groq returned no choices'), { retryable: true });
    }

    if (choice.finish_reason && !['stop', 'length'].includes(choice.finish_reason)) {
      throw Object.assign(new Error(`Generation stopped: ${choice.finish_reason}`), {
        retryable: false,
      });
    }

    const text = choice.message?.content || '';
    if (!text.trim()) {
      throw Object.assign(new Error('Groq returned an empty response'), { retryable: true });
    }

    try {
      return JSON.parse(text);
    } catch {
      // A `length` finish truncates mid-object, which JSON mode cannot save.
      throw Object.assign(new Error('Groq returned malformed JSON'), { retryable: true });
    }
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Calls Groq with JSON output. Retries once on a retryable failure, then gives
 * up — same policy as the Gemini path, for the same reason.
 */
export const generateStructured = async ({
  systemPrompt,
  userPrompt,
  responseSchema,
  temperature = 0.85,
}) => {
  if (!env.groq.isConfigured) {
    throw new ApiError(
      503,
      'AI trip planning is not configured on this server. Add GROQ_API_KEY to backend/.env.'
    );
  }

  try {
    return await callOnce({ systemPrompt, userPrompt, responseSchema, temperature });
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    if (!isTimeout && error.retryable === false) {
      throw new ApiError(502, `The trip planner failed: ${error.message}`);
    }

    console.warn(`[groq] retrying after: ${error.message || error.name}`);

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
