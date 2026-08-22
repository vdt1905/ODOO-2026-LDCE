import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { generateStructured as gemini } from './gemini.service.js';
import { generateStructured as groq } from './groq.service.js';

/**
 * One door to whichever model backend this deployment has a key for.
 *
 * The planner used to import `gemini.service.js` directly, which meant a
 * checkout with only `GROQ_API_KEY` set reported the feature as switched off —
 * even though the AI/ assistant was answering happily on that same key. Both
 * transports expose an identical `generateStructured`, so choosing between
 * them is a one-line lookup and the planner is none the wiser.
 *
 * `env.aiProvider` resolves `AI_PROVIDER` if it is set, otherwise Gemini then
 * Groq — Gemini first only because its structured-output mode enforces the
 * schema server-side, where Groq's JSON mode leans on the prompt.
 */
const PROVIDERS = { gemini, groq };

export const generateStructured = (options) => {
  const provider = env.aiProvider;

  if (!provider) {
    throw new ApiError(
      503,
      'AI trip planning is not configured on this server. Add GROQ_API_KEY or GEMINI_API_KEY to backend/.env.'
    );
  }

  return PROVIDERS[provider](options);
};
