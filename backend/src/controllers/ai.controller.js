import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { generateTrip } from '../services/ai.service.js';

/**
 * POST /ai/generate-trip
 *
 * Writes a complete, fully editable trip and returns its id. The client then
 * redirects to /trips/:tripId/build — the result is a draft, not an answer.
 */
export const generateTripFromPrompt = asyncHandler(async (req, res) => {
  const started = Date.now();

  const result = await generateTrip({ userId: req.user._id, input: req.body });

  console.log(
    `[ai] generated ${result.stopCount} stops / ${result.activityCount} activities in ${
      Date.now() - started
    }ms`
  );

  return sendCreated(res, {
    data: { ...result, generatedInMs: Date.now() - started },
    message: 'Your itinerary is ready',
  });
});

/**
 * GET /ai/status — lets the client hide the AI entry point when no key is set,
 * instead of offering a button that always fails.
 *
 * `provider` is reported alongside `model` so the client can name the right
 * env var in its "switched off" notice. Either backend counts as available:
 * the planner does not care which one answers.
 */
export const aiStatus = asyncHandler(async (_req, res) => {
  const provider = env.aiProvider;

  return sendSuccess(res, {
    data: {
      available: Boolean(provider),
      provider,
      model: provider ? env[provider].model : null,
      maxDays: 21,
    },
  });
});
