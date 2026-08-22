import { ApiError } from '../utils/ApiError.js';

/**
 * Express 4 defines `req.query` as a getter-only accessor. These files are ES
 * modules, so they run in strict mode, where assigning to it throws — hence
 * the defineProperty fallback rather than a plain assignment.
 */
const replace = (req, source, value) => {
  try {
    req[source] = value;
  } catch {
    Object.defineProperty(req, source, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
};

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

  replace(req, source, result.data);
  next();
};
