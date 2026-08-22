import crypto from 'node:crypto';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import {
  clearRefreshCookie,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/token.service.js';

/** Issues the token pair and sets the refresh cookie. */
const issueSession = (res, user) => {
  setRefreshCookie(res, signRefreshToken(user));
  return { user: user.toJSON(), accessToken: signAccessToken(user) };
};

export const register = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create(req.body);

  return sendCreated(res, {
    data: issueSession(res, user),
    message: `Welcome aboard, ${user.firstName}`,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // `password` is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such user" and "wrong password" — do not confirm
  // which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  return sendSuccess(res, {
    data: issueSession(res, user),
    message: `Welcome back, ${user.firstName}`,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookie.name];
  if (!token) throw ApiError.unauthorized('No active session');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session expired, please sign in again');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Account no longer exists');
  }

  // Rotate the refresh token on every use.
  return sendSuccess(res, { data: issueSession(res, user), message: 'Session refreshed' });
});

export const logout = asyncHandler(async (_req, res) => {
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { user: req.user.toJSON() } })
);

/**
 * Email delivery is out of scope for the hackathon — outside production the
 * token comes back in the response so the reset flow is still demoable.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const message = 'If that email is registered, a reset link is on its way';

  if (!user) return sendSuccess(res, { message });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  return sendSuccess(res, {
    message,
    data: env.isProd ? null : { resetToken: token },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendSuccess(res, { message: 'Password updated — you can sign in now' });
});
