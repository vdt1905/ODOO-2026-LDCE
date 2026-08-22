import { ApiError } from '../utils/ApiError.js';

/**
 * Runs a zod schema against one part of the request and replaces it with the
 * parsed result, so controllers receive coerced, trusted data only.
 *
 *   router.post('/', validate(registerSchema), authController.register)
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.unprocessable('Please check the highlighted fields', errors));
  }

  req[source] = result.data;
  next();
};
