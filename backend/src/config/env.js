import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for environment configuration.
 * Nothing else in the codebase reads `process.env` directly — import from here,
 * so a missing variable fails loudly at boot instead of silently at request time.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,

  mongoUri: required('MONGO_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  /**
   * Optional on purpose — the API boots without Cloudinary so a teammate who
   * has not filled these in can still run auth and trips. Upload routes return
   * a clear 503 instead of crashing at import time.
   */
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'globetrotter',
    get isConfigured() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  upload: {
    maxFileSizeMb: Number(process.env.UPLOAD_MAX_MB) || 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  },

  /**
   * Gemini — server-side only. The key must never reach the browser, which is
   * why all model traffic goes through /api/v1/ai/*.
   * Optional like Cloudinary: without a key the API still boots and the AI
   * route returns a clear 503 instead of crashing at import time.
   */
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    // 0 disables "thinking" on 2.5 models. Thinking tokens come out of the
    // same output budget, so leaving it on risks a MAX_TOKENS finish with no
    // usable JSON — a bad trade inside a 30s timeout.
    thinkingBudget: Number(process.env.GEMINI_THINKING_BUDGET) || 0,
    maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 32768,
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },

  /**
   * Groq — the second planner backend, and in practice the one that runs.
   *
   * Groq speaks the OpenAI chat-completions dialect, so `groq.service.js` is a
   * different transport for the same contract, not a different feature. It
   * exists because the AI/ service already ships a working `GROQ_API_KEY`:
   * without this, a checkout with Groq configured and no Gemini key showed
   * "the planner is switched off on this server" while a perfectly good model
   * sat one directory away.
   *
   * Same env var and same default model as AI/.env on purpose — one key powers
   * both the assistant and the planner.
   */
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
    model: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
    maxOutputTokens: Number(process.env.GROQ_MAX_OUTPUT_TOKENS) || 16384,
    // gpt-oss reasons before it answers, and those tokens come out of the same
    // budget — the Groq equivalent of Gemini's thinkingBudget. 'low' cut a
    // six-day plan from 3,727 completion tokens and 8.1s to 1,380 and 3.2s
    // with no loss of quality, so it is the default rather than an economy.
    reasoningEffort: process.env.GROQ_REASONING_EFFORT || 'low',
    get isConfigured() {
      return Boolean(this.apiKey);
    },
  },

  /**
   * Which backend the planner uses. `AI_PROVIDER` forces one; otherwise
   * whichever is configured wins, Gemini first because its structured-output
   * mode is stricter than a JSON-mode prompt.
   */
  get aiProvider() {
    const forced = (process.env.AI_PROVIDER || '').trim().toLowerCase();
    if (forced === 'gemini' || forced === 'groq') return forced;
    if (this.gemini.isConfigured) return 'gemini';
    if (this.groq.isConfigured) return 'groq';
    return null;
  },

  cookie: {
    name: 'gt_refresh',
    // 7 days in ms — keep in sync with jwt.refreshExpiry
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
