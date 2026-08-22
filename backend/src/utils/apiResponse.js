/**
 * Every successful response has the same envelope so the frontend can unwrap
 * it in exactly one place (`api/axios.js`).
 */
export const sendSuccess = (res, { data = null, message = 'OK', status = 200 } = {}) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = (res, { data = null, message = 'Created' } = {}) =>
  sendSuccess(res, { data, message, status: 201 });
