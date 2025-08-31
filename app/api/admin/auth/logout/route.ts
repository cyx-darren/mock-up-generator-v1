import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokens, clearAuthCookies } from '@/lib/auth/cookies';
import { invalidateSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = getAuthTokens(request);

    if (sessionId) {
      // Invalidate session in database
      await invalidateSession(sessionId);
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