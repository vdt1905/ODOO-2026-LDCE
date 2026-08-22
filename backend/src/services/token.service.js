import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Access token  → returned in the JSON body, held in memory by the client (15m).
 * Refresh token → httpOnly cookie the JS on the page cannot read (7d).
 */
export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

/**
 * In production the API and the SPA live on different origins, so the cookie
 * must be SameSite=None + Secure or the browser silently drops it.
 */
export const setRefreshCookie = (res, token) => {
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: env.cookie.maxAge,
    path: '/',
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(env.cookie.name, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
  });
};
