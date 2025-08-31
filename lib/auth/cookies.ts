import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  SESSION_ID: 'session-id',
} as const;

export function setAuthCookies(
  response: NextResponse,
  tokens: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    expiresAt: Date;
  }
) {
  // Set access token (15 minutes)
  response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });

  // Set refresh token (7 days or 30 days based on remember me)
  response.cookies.set(AUTH_COOKIES.REFRESH_TOKEN, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    expires: tokens.expiresAt,
  });

  // Set session ID
  response.cookies.set(AUTH_COOKIES.SESSION_ID, tokens.sessionId, {
    ...COOKIE_OPTIONS,
    expires: tokens.expiresAt,
  });
}

export function clearAuthCookies(response: NextResponse) {
  Object.values(AUTH_COOKIES).forEach(cookieName => {
    response.cookies.delete(cookieName);
  });
}

export function getAuthTokens(request?: NextRequest) {
  const cookieStore = request ? request.cookies : cookies();
  
  return {
    accessToken: cookieStore.get(AUTH_COOKIES.ACCESS_TOKEN)?.value,
    refreshToken: cookieStore.get(AUTH_COOKIES.REFRESH_TOKEN)?.value,
    sessionId: cookieStore.get(AUTH_COOKIES.SESSION_ID)?.value,
  };
}

export function hasAuthTokens(request?: NextRequest): boolean {
  const tokens = getAuthTokens(request);
  return !!(tokens.accessToken && tokens.refreshToken && tokens.sessionId);
}