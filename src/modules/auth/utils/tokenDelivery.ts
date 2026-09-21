import { Request, Response } from 'express';
import { env } from '../../../config/env';
import {
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
} from './refreshCookie';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/** Prefer httpOnly cookie, then JSON body — supports both delivery modes. */
export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.trim().length > 0) {
    return fromCookie.trim();
  }

  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody.trim().length > 0) {
    return fromBody.trim();
  }

  return undefined;
}

/**
 * Deliver tokens based on AUTH_TOKEN_DELIVERY:
 * - cookie: set httpOnly refresh cookie; return accessToken only in JSON
 * - body: return both tokens in JSON; clear any stale refresh cookie
 */
export function deliverAuthTokens<T extends Record<string, unknown>>(
  res: Response,
  tokens: TokenPair,
  extra?: T
): T & { accessToken: string; refreshToken?: string } {
  if (env.AUTH_TOKEN_DELIVERY === 'cookie') {
    setRefreshTokenCookie(res, tokens.refreshToken);
    return {
      ...(extra as T),
      accessToken: tokens.accessToken,
    };
  }

  clearRefreshTokenCookie(res);
  return {
    ...(extra as T),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}
