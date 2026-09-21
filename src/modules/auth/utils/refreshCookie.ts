import { CookieOptions, Response } from 'express';
import { env } from '../../../config/env';
import { parseDurationToMs } from '../../../shared/utils/duration';

export const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Cookie auth notes (CSRF):
 * - Refresh token is httpOnly so JS cannot read it (XSS-resistant).
 * - sameSite: 'strict' blocks cross-site cookie sends — good for same-origin SPAs.
 * - path is limited to /api/auth so the cookie is only sent to auth routes.
 * - For a frontend on another origin, use sameSite: 'none' + secure: true,
 *   keep CORS credentials enabled, and add a CSRF token (double-submit or header).
 * - Do not store the refresh token in localStorage.
 */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    path: '/api/auth',
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}
