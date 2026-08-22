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
 */
export const aiStatus = asyncHandler(async (_req, res) =>
  sendSuccess(res, {
    data: {
      available: env.gemini.isConfigured,
      model: env.gemini.isConfigured ? env.gemini.model : null,
      maxDays: 21,
    },
  })
);
