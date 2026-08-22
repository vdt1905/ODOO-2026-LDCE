import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/* eslint-disable no-unused-vars */
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || [];

  // Mongoose duplicate key → a friendlier 409 than "E11000".
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    statusCode = 409;
    message = `An account with that ${field} already exists`;
    errors = [{ field, message }];
  }

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Please check the highlighted fields';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};
