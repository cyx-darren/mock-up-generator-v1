import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
}

export function generateTokens(payload: Omit<TokenPayload, 'sessionId'>, rememberMe = false) {
  const sessionId = crypto.randomUUID();

  const accessTokenPayload: TokenPayload = {
    ...payload,
    sessionId,
  };

  const refreshTokenPayload: RefreshTokenPayload = {
    userId: payload.userId,
    sessionId,
    type: 'refresh',
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
  });

  const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d', // Long-lived refresh token
  });

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresAt: new Date(
      Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)
    ),
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
}
