import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens, clearAuthCookies } from '@/lib/auth/cookies';
import { terminateSession } from '@/lib/auth/session-manager';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, sessionId } = getAuthTokens(request);
    let userId: string | undefined;

    // Get user ID from token for additional security
    if (accessToken) {
      try {
        const tokenPayload = verifyAccessToken(accessToken);
        userId = tokenPayload.userId;
      } catch (error) {
        // Token might be expired, but we can still terminate session by ID
      }
    }

    if (sessionId) {
      // Terminate session in database with optional user ID for security
      await terminateSession(sessionId, userId);
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearAuthCookies(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if session invalidation fails
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearAuthCookies(response);

    return response;
  }
}