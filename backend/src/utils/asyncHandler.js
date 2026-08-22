/**
 * Wraps an async controller so a rejected promise reaches the error middleware
 * instead of hanging the request. Every controller export is wrapped in this.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
